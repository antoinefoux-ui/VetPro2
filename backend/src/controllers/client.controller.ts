import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import logger from '../utils/logger';

const prismaAny = prisma as any;

// Validation schemas
const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().nullable(),
  phonePrimary: z.string().min(1, 'Primary phone is required'),
  phoneSecondary: z.string().optional().nullable(),
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default('Slovakia'),
  idNumber: z.string().optional().nullable(),
  preferredLanguage: z.string().default('sk'),
  preferredVetId: z.string().uuid().optional().nullable(),
  referralSource: z.string().optional().nullable(),
  marketingConsent: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

const updateClientSchema = createClientSchema.partial();

export class ClientController {
  
  // Get all clients with search, filter, pagination
  static async getAll(req: Request, res: Response) {
    try {
      const { 
        search, 
        page = '1', 
        limit = '20',
        sortBy = 'lastName',
        sortOrder = 'asc',
        isActive,
        preferredVetId,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (preferredVetId) {
        where.preferredVetId = preferredVetId as string;
      }

      // Full-text search across multiple fields
      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phonePrimary: { contains: search as string } },
        ];
      }

      // Execute query
      const [clients, total] = await Promise.all([
        prismaAny.client.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy as string]: sortOrder },
          include: {
            pets: {
              select: {
                id: true,
                name: true,
                species: true,
                isDeceased: true,
              },
            },
            _count: {
              select: {
                appointments: true,
                invoices: true,
              },
            },
          },
        }),
        prismaAny.client.count({ where }),
      ]);

      res.json({
        data: clients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  // Get single client with complete details
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = await prismaAny.client.findUnique({
        where: { id },
        include: {
          pets: {
            include: {
              vaccinations: {
                orderBy: { administeredDate: 'desc' },
                take: 5,
              },
              appointments: {
                orderBy: { scheduledStart: 'desc' },
                take: 10,
                include: {
                  vet: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              weightHistory: {
                orderBy: { measuredAt: 'desc' },
                take: 10,
              },
            },
          },
          appointments: {
            orderBy: { scheduledStart: 'desc' },
            take: 20,
            include: {
              pet: {
                select: {
                  name: true,
                  species: true,
                },
              },
              vet: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          invoices: {
            orderBy: { issueDate: 'desc' },
            take: 20,
            include: {
              pet: {
                select: {
                  name: true,
                },
              },
            },
          },
          communications: {
            orderBy: { sentAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Calculate client lifetime value
      const totalRevenue = await prismaAny.invoice.aggregate({
        where: { 
          clientId: id,
          status: { in: ['paid', 'partially_paid'] },
        },
        _sum: {
          amountPaid: true,
        },
      });

      res.json({
        ...client,
        lifetimeValue: totalRevenue._sum.amountPaid || 0,
      });

    } catch (error) {
      logger.error('Error fetching client:', error);
      res.status(500).json({ error: 'Failed to fetch client' });
    }
  }

  // Create new client
  static async create(req: Request, res: Response) {
    try {
      const validated = createClientSchema.parse(req.body);

      // Check for duplicate phone number
      const existingClient = await prismaAny.client.findFirst({
        where: {
          phonePrimary: validated.phonePrimary,
          isActive: true,
        },
      });

      if (existingClient) {
        return res.status(400).json({ 
          error: 'A client with this phone number already exists' 
        });
      }

      const client = await prismaAny.client.create({
        data: validated,
        include: {
          pets: true,
        },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_CLIENT',
          entityType: 'client',
          entityId: client.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Client created: ${client.id} by user ${req.user?.id}`);

      res.status(201).json(client);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client' });
    }
  }

  // Update client
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateClientSchema.parse(req.body);

      // Get old values for audit
      const oldClient = await prismaAny.client.findUnique({ where: { id } });
      
      if (!oldClient) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const client = await prismaAny.client.update({
        where: { id },
        data: validated,
        include: {
          pets: true,
        },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_CLIENT',
          entityType: 'client',
          entityId: client.id,
          oldValues: oldClient,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Client updated: ${client.id} by user ${req.user?.id}`);

      res.json(client);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  }

  // Soft delete client
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = await prismaAny.client.update({
        where: { id },
        data: { isActive: false },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_CLIENT',
          entityType: 'client',
          entityId: client.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Client deactivated: ${client.id} by user ${req.user?.id}`);

      res.json({ message: 'Client deactivated successfully' });

    } catch (error) {
      logger.error('Error deleting client:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  }

  // Get client communication history
  static async getCommunications(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { clientId: id };
      if (type) {
        where.communicationType = type;
      }

      const [communications, total] = await Promise.all([
        prismaAny.clientCommunication.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { sentAt: 'desc' },
          include: {
            sentBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        prismaAny.clientCommunication.count({ where }),
      ]);

      res.json({
        data: communications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching communications:', error);
      res.status(500).json({ error: 'Failed to fetch communications' });
    }
  }

  // Send communication to client
  static async sendCommunication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, subject, content, sendNow = true } = req.body;

      // Validate client exists
      const client = await prismaAny.client.findUnique({ where: { id } });
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Create communication record
      const communication = await prismaAny.clientCommunication.create({
        data: {
          clientId: id,
          communicationType: type,
          direction: 'outbound',
          subject,
          content,
          sentById: req.user?.id,
          status: sendNow ? 'sent' : 'draft',
          metadata: {
            to: type === 'email' ? client.email : client.phonePrimary,
          },
        },
      });

      // Actually send the communication
      if (sendNow) {
        if (type === 'email' && client.email) {
          // TODO: Integrate with SendGrid
          // await sendEmail(client.email, subject, content);
        } else if (type === 'sms' && client.phonePrimary) {
          // TODO: Integrate with Twilio
          // await sendSMS(client.phonePrimary, content);
        }
      }

      logger.info(`Communication sent to client ${id}: ${type}`);

      res.status(201).json(communication);

    } catch (error) {
      logger.error('Error sending communication:', error);
      res.status(500).json({ error: 'Failed to send communication' });
    }
  }

  // Get client statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const [
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalInvoices,
        paidInvoices,
        totalRevenue,
        outstandingBalance,
        pets,
        lastVisit,
      ] = await Promise.all([
        prismaAny.appointment.count({ where: { clientId: id } }),
        prismaAny.appointment.count({ where: { clientId: id, status: 'completed' } }),
        prismaAny.appointment.count({ where: { clientId: id, status: 'cancelled' } }),
        prismaAny.invoice.count({ where: { clientId: id } }),
        prismaAny.invoice.count({ where: { clientId: id, status: 'paid' } }),
        prismaAny.invoice.aggregate({
          where: { clientId: id, status: { in: ['paid', 'partially_paid'] } },
          _sum: { amountPaid: true },
        }),
        prismaAny.invoice.aggregate({
          where: { clientId: id, status: { in: ['approved', 'sent', 'overdue', 'partially_paid'] } },
          _sum: { balanceDue: true },
        }),
        prismaAny.pet.count({ where: { clientId: id, isDeceased: false } }),
        prismaAny.appointment.findFirst({
          where: { clientId: id, status: 'completed' },
          orderBy: { scheduledStart: 'desc' },
          select: { scheduledStart: true },
        }),
      ]);

      res.json({
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShowRate: totalAppointments > 0 
            ? ((cancelledAppointments / totalAppointments) * 100).toFixed(2) 
            : 0,
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
        },
        financial: {
          lifetimeValue: totalRevenue._sum.amountPaid || 0,
          outstandingBalance: outstandingBalance._sum.balanceDue || 0,
        },
        pets: {
          active: pets,
        },
        lastVisit: lastVisit?.scheduledStart || null,
      });

    } catch (error) {
      logger.error('Error fetching client statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  // Merge duplicate clients
  static async merge(req: Request, res: Response) {
    try {
      const { sourceId, targetId } = req.body;

      // Validate both clients exist
      const [sourceClient, targetClient] = await Promise.all([
        prismaAny.client.findUnique({ where: { id: sourceId } }),
        prismaAny.client.findUnique({ where: { id: targetId } }),
      ]);

      if (!sourceClient || !targetClient) {
        return res.status(404).json({ error: 'One or both clients not found' });
      }

      // Transfer all data to target client
      await prismaAny.$transaction([
        // Transfer pets
        prismaAny.pet.updateMany({
          where: { clientId: sourceId },
          data: { clientId: targetId },
        }),
        // Transfer appointments
        prismaAny.appointment.updateMany({
          where: { clientId: sourceId },
          data: { clientId: targetId },
        }),
        // Transfer invoices
        prismaAny.invoice.updateMany({
          where: { clientId: sourceId },
          data: { clientId: targetId },
        }),
        // Transfer communications
        prismaAny.clientCommunication.updateMany({
          where: { clientId: sourceId },
          data: { clientId: targetId },
        }),
        // Deactivate source client
        prismaAny.client.update({
          where: { id: sourceId },
          data: { 
            isActive: false,
            notes: `Merged into client ${targetId} on ${new Date().toISOString()}`,
          },
        }),
      ]);

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'MERGE_CLIENTS',
          entityType: 'client',
          entityId: targetId,
          oldValues: { sourceId, targetId },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Clients merged: ${sourceId} -> ${targetId} by user ${req.user?.id}`);

      res.json({ message: 'Clients merged successfully', targetId });

    } catch (error) {
      logger.error('Error merging clients:', error);
      res.status(500).json({ error: 'Failed to merge clients' });
    }
  }

  // Export client data (GDPR compliance)
  static async exportData(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = await prismaAny.client.findUnique({
        where: { id },
        include: {
          pets: {
            include: {
              vaccinations: true,
              diagnoses: true,
              treatments: true,
              prescriptions: true,
              surgeries: true,
              labTests: true,
              diagnosticImaging: true,
              weightHistory: true,
            },
          },
          appointments: {
            include: {
              visitNotes: true,
            },
          },
          invoices: {
            include: {
              items: true,
              payments: true,
            },
          },
          communications: true,
          eshopOrders: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Log export for compliance
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'EXPORT_CLIENT_DATA',
          entityType: 'client',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json({
        exportDate: new Date().toISOString(),
        client,
      });

    } catch (error) {
      logger.error('Error exporting client data:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
}

export default ClientController;

