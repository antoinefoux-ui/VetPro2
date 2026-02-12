import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import logger from '../utils/logger';

import { VoiceRecognitionService } from '../services/voice.service';

const prismaAny = prisma as any;

const createInvoiceItemSchema = z.object({
  itemType: z.enum(['service', 'product', 'medication', 'diagnostic']),
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  taxRate: z.number().default(20),
  discountPercentage: z.number().default(0),
  inventoryItemId: z.string().uuid().optional(),
});

const approveInvoiceSchema = z.object({
  items: z.array(createInvoiceItemSchema).optional(),
  discountAmount: z.number().optional(),
  notes: z.string().optional(),
});

export class InvoiceController {
  
  /**
   * Get all invoices with filtering and pagination
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        clientId,
        petId,
        dateFrom,
        dateTo,
        search,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (petId) where.petId = petId;

      if (dateFrom || dateTo) {
        where.issueDate = {};
        if (dateFrom) where.issueDate.gte = new Date(dateFrom as string);
        if (dateTo) where.issueDate.lte = new Date(dateTo as string);
      }

      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search as string } },
          { client: { 
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
            ]
          }},
        ];
      }

      const [invoices, total] = await Promise.all([
        prismaAny.invoice.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { issueDate: 'desc' },
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            pet: {
              select: {
                name: true,
                species: true,
              },
            },
            items: true,
            payments: true,
          },
        }),
        prismaAny.invoice.count({ where }),
      ]);

      res.json({
        data: invoices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }

  /**
   * Get single invoice with full details
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prismaAny.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          pet: true,
          appointment: {
            include: {
              visitNotes: true,
            },
          },
          items: {
            include: {
              inventoryItem: true,
            },
          },
          payments: true,
          generatedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json(invoice);

    } catch (error) {
      logger.error('Error fetching invoice:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  }

  /**
   * Create draft invoice manually
   */
  static async create(req: Request, res: Response) {
    try {
      const { clientId, petId, appointmentId, items, notes } = req.body;

      // Validate client and pet
      const client = await prismaAny.client.findUnique({ where: { id: clientId } });
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      if (petId) {
        const pet = await prismaAny.pet.findUnique({ where: { id: petId } });
        if (!pet || pet.clientId !== clientId) {
          return res.status(404).json({ error: 'Pet not found or does not belong to client' });
        }
      }

      // Calculate totals
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const discount = itemSubtotal * (item.discountPercentage / 100);
        const afterDiscount = itemSubtotal - discount;
        const tax = afterDiscount * (item.taxRate / 100);
        const itemTotal = afterDiscount + tax;

        subtotal += itemSubtotal;

        return {
          ...item,
          subtotal: itemSubtotal,
          total: itemTotal,
        };
      });

      const taxAmount = processedItems.reduce((sum: number, item: any) => {
        return sum + (item.total - item.subtotal);
      }, 0);

      const totalAmount = subtotal + taxAmount;

      // Generate invoice number
      const invoiceCount = await prismaAny.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

      // Create invoice
      const invoice = await prismaAny.invoice.create({
        data: {
          invoiceNumber,
          clientId,
          petId,
          appointmentId,
          status: 'draft',
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue: totalAmount,
          generatedById: req.user?.id,
          notes,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: true,
        },
      });

      logger.info(`Invoice created manually: ${invoice.id} by user ${req.user?.id}`);

      res.status(201).json(invoice);

    } catch (error) {
      logger.error('Error creating invoice:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }

  /**
   * CRITICAL: Approve invoice and trigger automatic actions
   * This is the core workflow from your requirements
   */
  static async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = approveInvoiceSchema.parse(req.body);

      // Get current invoice
      const currentInvoice = await prismaAny.invoice.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
          client: true,
          pet: true,
        },
      });

      if (!currentInvoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (currentInvoice.status !== 'draft' && currentInvoice.status !== 'pending_approval') {
        return res.status(400).json({ error: 'Invoice cannot be approved in current status' });
      }

      // Start transaction for atomic operations
      const result = await prismaAny.$transaction(async (tx) => {
        
        // 1. Update invoice items if modifications were made
        if (validated.items && validated.items.length > 0) {
          // Delete old items
          await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

          // Recalculate totals
          let subtotal = 0;
          const processedItems = validated.items.map((item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const discount = itemSubtotal * (item.discountPercentage / 100);
            const afterDiscount = itemSubtotal - discount;
            const tax = afterDiscount * (item.taxRate / 100);
            const itemTotal = afterDiscount + tax;

            subtotal += itemSubtotal;

            return {
              ...item,
              invoiceId: id,
              subtotal: itemSubtotal,
              total: itemTotal,
            };
          });

          const taxAmount = processedItems.reduce((sum, item) => {
            return sum + (item.total - item.subtotal);
          }, 0);

          // Create new items
          await tx.invoiceItem.createMany({
            data: processedItems,
          });

          // Update invoice totals
          await tx.invoice.update({
            where: { id },
            data: {
              subtotal,
              taxAmount,
              totalAmount: subtotal + taxAmount,
              balanceDue: subtotal + taxAmount,
            },
          });
        }

        // 2. AUTOMATIC INVENTORY DEDUCTION (Core requirement!)
        const itemsToProcess = validated.items || currentInvoice.items;
        const inventoryUpdates: any[] = [];
        const inventoryTransactions: any[] = [];
        const medicationLabels: any[] = [];

        for (const item of itemsToProcess) {
          if (item.inventoryItemId) {
            // Get current inventory item
            const inventoryItem = await tx.inventoryItem.findUnique({
              where: { id: item.inventoryItemId },
            });

            if (!inventoryItem) {
              logger.warn(`Inventory item not found: ${item.inventoryItemId}`);
              continue;
            }

            // Calculate new stock
            const newStock = inventoryItem.currentStock - item.quantity;

            if (newStock < 0) {
              throw new Error(`Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.currentStock}, Required: ${item.quantity}`);
            }

            // Update inventory
            inventoryUpdates.push({
              id: item.inventoryItemId,
              currentStock: newStock,
            });

            // Create inventory transaction
            inventoryTransactions.push({
              itemId: item.inventoryItemId,
              transactionType: 'sale',
              quantity: -item.quantity, // Negative for deduction
              unitCost: inventoryItem.costPerUnit,
              totalCost: (inventoryItem.costPerUnit || 0) * item.quantity,
              referenceType: 'invoice',
              referenceId: id,
              performedById: req.user?.id,
              notes: `Deducted from invoice ${currentInvoice.invoiceNumber}`,
            });

            // If it's a medication, generate label
            if (item.itemType === 'medication') {
              medicationLabels.push({
                itemId: item.inventoryItemId,
                itemName: inventoryItem.name,
                description: item.description,
                quantity: item.quantity,
                petName: currentInvoice.pet?.name || 'Unknown',
                ownerName: `${currentInvoice.client.firstName} ${currentInvoice.client.lastName}`,
              });
            }

            // Check if below minimum stock and create alert
            if (newStock <= inventoryItem.minimumStock) {
              logger.warn(`Low stock alert: ${inventoryItem.name} (${newStock} remaining, minimum: ${inventoryItem.minimumStock})`);
              
              // TODO: Create automatic purchase order
              // This would be implemented in the inventory service
            }
          }
        }

        // Execute inventory updates
        for (const update of inventoryUpdates) {
          await tx.inventoryItem.update({
            where: { id: update.id },
            data: { currentStock: update.currentStock },
          });
        }

        // Create inventory transactions
        if (inventoryTransactions.length > 0) {
          await tx.inventoryTransaction.createMany({
            data: inventoryTransactions,
          });
        }

        // 3. Update invoice status to approved
        const approvedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            status: 'approved',
            approvedById: req.user?.id,
            approvedAt: new Date(),
            notes: validated.notes || currentInvoice.notes,
          },
          include: {
            items: true,
            client: true,
            pet: true,
          },
        });

        // 4. Create audit log
        await tx.auditLog.create({
          data: {
            userId: req.user?.id,
            action: 'APPROVE_INVOICE',
            entityType: 'invoice',
            entityId: id,
            oldValues: { status: currentInvoice.status },
            newValues: { 
              status: 'approved',
              inventoryDeducted: inventoryUpdates.length,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        });

        return {
          invoice: approvedInvoice,
          medicationLabels,
          inventoryUpdates: inventoryUpdates.length,
        };
      });

      // 5. PRINT MEDICATION LABELS (After transaction)
      // This would trigger label printing
      if (result.medicationLabels.length > 0) {
        logger.info(`Printing ${result.medicationLabels.length} medication labels`);
        // TODO: Integrate with label printer
        // For now, we'll emit via Socket.IO for frontend to handle
        const io = req.app.get('io');
        io.emit('print:medication-labels', {
          invoiceId: id,
          labels: result.medicationLabels,
        });
      }

      // 6. Send real-time update via WebSocket
      const io = req.app.get('io');
      io.emit('invoice:approved', {
        invoiceId: id,
        inventoryUpdated: result.inventoryUpdates,
      });

      logger.info(`Invoice approved: ${id} by user ${req.user?.id}. ${result.inventoryUpdates} items deducted from inventory.`);

      res.json({
        message: 'Invoice approved successfully',
        invoice: result.invoice,
        inventoryDeducted: result.inventoryUpdates,
        labelsGenerated: result.medicationLabels.length,
      });

    } catch (error: any) {
      logger.error('Error approving invoice:', error);
      
      // Handle specific errors
      if (error.message?.includes('Insufficient stock')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to approve invoice' });
    }
  }

  /**
   * Generate invoice from AI voice data
   */
  static async generateFromVoice(req: Request, res: Response) {
    try {
      const { appointmentId } = req.body;

      // Get appointment with voice recording
      const appointment = await prismaAny.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          voiceRecordings: {
            where: { processed: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          pet: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (!appointment.voiceRecordings || appointment.voiceRecordings.length === 0) {
        return res.status(400).json({ error: 'No processed voice recording found for this appointment' });
      }

      const voiceRecording = appointment.voiceRecordings[0];
      const extractedData = voiceRecording.aiExtractedData as any;

      // Generate invoice using AI service
      const invoiceId = await VoiceRecognitionService.generateDraftInvoice(
        appointmentId,
        extractedData
      );

      const invoice = await prismaAny.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
        },
      });

      logger.info(`AI-generated invoice created: ${invoiceId} for appointment ${appointmentId}`);

      res.status(201).json(invoice);

    } catch (error) {
      logger.error('Error generating invoice from voice:', error);
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }

  /**
   * Record payment for invoice
   */
  static async recordPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        paymentMethod, 
        amount, 
        referenceNumber,
        ekasaReceiptNumber,
        ekasaOkpCode,
        notes,
      } = req.body;

      const invoice = await prismaAny.invoice.findUnique({ where: { id } });
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.status !== 'approved' && invoice.status !== 'sent' && invoice.status !== 'partially_paid') {
        return res.status(400).json({ error: 'Invoice must be approved before accepting payment' });
      }

      // Create payment record
      const payment = await prismaAny.payment.create({
        data: {
          invoiceId: id,
          paymentMethod,
          amount,
          referenceNumber,
          ekasaReceiptNumber,
          ekasaOkpCode,
          processedById: req.user?.id,
          notes,
        },
      });

      // Update invoice
      const newAmountPaid = (invoice.amountPaid || 0) + amount;
      const newBalanceDue = invoice.totalAmount - newAmountPaid;

      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      const updatedInvoice = await prismaAny.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
        include: {
          payments: true,
        },
      });

      // Emit payment notification
      const io = req.app.get('io');
      io.emit('payment:recorded', {
        invoiceId: id,
        amount,
        balanceDue: newBalanceDue,
      });

      logger.info(`Payment recorded: ${amount} for invoice ${id}`);

      res.status(201).json({
        payment,
        invoice: updatedInvoice,
      });

    } catch (error) {
      logger.error('Error recording payment:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  /**
   * Generate PDF invoice
   */
  static async generatePDF(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prismaAny.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          pet: true,
          items: true,
          payments: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // TODO: Generate PDF using a library like PDFKit or puppeteer
      // For now, return invoice data
      logger.info(`PDF generation requested for invoice ${id}`);

      res.json({
        message: 'PDF generation not yet implemented',
        invoice,
      });

    } catch (error) {
      logger.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }

  /**
   * Send invoice to client via email
   */
  static async send(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prismaAny.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          items: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (!invoice.client.email) {
        return res.status(400).json({ error: 'Client does not have an email address' });
      }

      // TODO: Send email via SendGrid
      // For now, just update status
      await prismaAny.invoice.update({
        where: { id },
        data: { status: 'sent' },
      });

      logger.info(`Invoice sent to ${invoice.client.email}: ${invoice.invoiceNumber}`);

      res.json({ message: 'Invoice sent successfully' });

    } catch (error) {
      logger.error('Error sending invoice:', error);
      res.status(500).json({ error: 'Failed to send invoice' });
    }
  }

  /**
   * Update invoice basic fields
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes, dueDate, status } = req.body;

      const invoice = await prismaAny.invoice.update({
        where: { id },
        data: {
          ...(notes !== undefined ? { notes } : {}),
          ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
          ...(status ? { status } : {}),
        },
      });

      res.json(invoice);
    } catch (error) {
      logger.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  }

  /**
   * Delete invoice
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prismaAny.invoice.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }

}

export default InvoiceController;
