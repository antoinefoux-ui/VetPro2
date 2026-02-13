import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import logger from '../utils/logger';


const createInventoryItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  packageSize: z.string().optional(),
  costPerUnit: z.number().optional(),
  sellingPrice: z.number().optional(),
  markupPercentage: z.number().optional(),
  isPrescription: z.boolean().default(false),
  isControlledSubstance: z.boolean().default(false),
  requiresRefrigeration: z.boolean().default(false),
  minimumStock: z.number().default(0),
  optimalStock: z.number().optional(),
  currentStock: z.number().default(0),
  location: z.string().optional(),
  isSellableInEshop: z.boolean().default(false),
});

export class InventoryController {
  
  /**
   * Get all inventory items with filtering
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '50',
        search,
        categoryId,
        location,
        lowStock,
        outOfStock,
        sellableInEshop,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (categoryId) where.categoryId = categoryId;
      if (location) where.location = location;
      if (sellableInEshop === 'true') where.isSellableInEshop = true;

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string } },
          { barcode: { contains: search as string } },
          { manufacturer: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Low stock filter
      if (lowStock === 'true') {
        where.AND = [
          { currentStock: { lte: prismaAny.inventoryItem.fields.minimumStock } },
          { currentStock: { gt: 0 } },
        ];
      }

      // Out of stock filter
      if (outOfStock === 'true') {
        where.currentStock = 0;
      }

      const [items, total] = await Promise.all([
        prismaAny.inventoryItem.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { name: 'asc' },
          include: {
            batches: {
              orderBy: { expirationDate: 'asc' },
              take: 3,
            },
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        }),
        prismaAny.inventoryItem.count({ where }),
      ]);

      // Add stock status for each item
      const itemsWithStatus = items.map(item => ({
        ...item,
        stockStatus: this.getStockStatus(item),
      }));

      res.json({
        data: itemsWithStatus,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  }

  /**
   * Get inventory alerts (low stock, expiring, etc.)
   */
  static async getAlerts(req: Request, res: Response) {
    try {
      // Low stock items
      const lowStockItems = await prismaAny.$queryRaw`
        SELECT * FROM inventory_items 
        WHERE current_stock <= minimum_stock 
        AND current_stock > 0
        ORDER BY (current_stock::float / NULLIF(minimum_stock, 0)) ASC
        LIMIT 50
      `;

      // Out of stock items
      const outOfStockItems = await prismaAny.inventoryItem.findMany({
        where: { currentStock: 0 },
        take: 50,
      });

      // Expiring soon (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringBatches = await prismaAny.inventoryBatch.findMany({
        where: {
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
          quantity: { gt: 0 },
        },
        include: {
          item: true,
        },
        orderBy: { expirationDate: 'asc' },
        take: 50,
      });

      // Check for items needing purchase orders
      const needsOrdering = await this.identifyItemsNeedingOrders();

      res.json({
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        expiringSoon: expiringBatches,
        needsOrdering,
        summary: {
          lowStockCount: (lowStockItems as any[]).length,
          outOfStockCount: outOfStockItems.length,
          expiringCount: expiringBatches.length,
          needsOrderingCount: needsOrdering.length,
        },
      });

    } catch (error) {
      logger.error('Error fetching inventory alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  /**
   * Create new inventory item
   */
  static async create(req: Request, res: Response) {
    try {
      const validated = createInventoryItemSchema.parse(req.body);

      // Check for duplicate SKU
      if (validated.sku) {
        const existing = await prismaAny.inventoryItem.findUnique({
          where: { sku: validated.sku },
        });

        if (existing) {
          return res.status(400).json({ error: 'SKU already exists' });
        }
      }

      const item = await prismaAny.inventoryItem.create({
        data: validated,
      });

      logger.info(`Inventory item created: ${item.id} - ${item.name}`);

      res.status(201).json(item);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error creating inventory item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }

  /**
   * Update inventory item
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = createInventoryItemSchema.partial().parse(req.body);

      const item = await prismaAny.inventoryItem.update({
        where: { id },
        data: validated,
      });

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('inventory:updated', item);

      res.json(item);

    } catch (error) {
      logger.error('Error updating inventory item:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  }

  /**
   * Adjust stock manually
   */
  static async adjustStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, reason, notes } = req.body;

      const item = await prismaAny.inventoryItem.findUnique({ where: { id } });
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const newStock = item.currentStock + quantity;

      if (newStock < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      // Update stock and create transaction
      const [updatedItem, transaction] = await prismaAny.$transaction([
        prismaAny.inventoryItem.update({
          where: { id },
          data: { currentStock: newStock },
        }),
        prismaAny.inventoryTransaction.create({
          data: {
            itemId: id,
            transactionType: reason || 'adjustment',
            quantity,
            performedById: req.user?.id,
            notes,
          },
        }),
      ]);

      // Check if stock alert needed
      if (newStock <= item.minimumStock) {
        logger.warn(`Low stock alert: ${item.name} (${newStock} remaining)`);
        // Trigger auto purchase order
        await this.createAutoPurchaseOrder(item);
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('inventory:stock-adjusted', {
        item: updatedItem,
        transaction,
      });

      res.json({
        item: updatedItem,
        transaction,
      });

    } catch (error) {
      logger.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  }

  /**
   * Get stock history for an item
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [transactions, total] = await Promise.all([
        prismaAny.inventoryTransaction.findMany({
          where: { itemId: id },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            item: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        }),
        prismaAny.inventoryTransaction.count({ where: { itemId: id } }),
      ]);

      res.json({
        data: transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching stock history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  /**
   * Create purchase order (manual or auto)
   */
  static async createPurchaseOrder(req: Request, res: Response) {
    try {
      const { supplierId, items, notes, expectedDeliveryDate } = req.body;

      // Generate PO number
      const poCount = await prismaAny.purchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotal = 0;
      const processedItems = items.map((item: any) => {
        const itemTotal = item.quantity * item.unitCost;
        subtotal += itemTotal;
        return {
          ...item,
          totalCost: itemTotal,
        };
      });

      const tax = subtotal * 0.20; // 20% VAT
      const total = subtotal + tax;

      const purchaseOrder = await prismaAny.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          status: 'draft',
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
          subtotal,
          tax,
          total,
          createdById: req.user?.id,
          notes,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          supplier: true,
        },
      });

      logger.info(`Purchase order created: ${purchaseOrder.poNumber}`);

      res.status(201).json(purchaseOrder);

    } catch (error) {
      logger.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  }

  /**
   * Approve purchase order
   */
  static async approvePurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const po = await prismaAny.purchaseOrder.update({
        where: { id },
        data: {
          status: 'approved',
          approvedById: req.user?.id,
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      // TODO: Send PO to supplier via email
      logger.info(`Purchase order approved: ${po.poNumber}`);

      res.json(po);

    } catch (error) {
      logger.error('Error approving purchase order:', error);
      res.status(500).json({ error: 'Failed to approve purchase order' });
    }
  }

  /**
   * Receive inventory (mark PO as received)
   */
  static async receiveInventory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { itemId, quantityReceived, batchNumber, expirationDate }

      const po = await prismaAny.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!po) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      // Update inventory for each item
      const updates = [];

      for (const receivedItem of items) {
        const poItem = po.items.find(i => i.itemId === receivedItem.itemId);
        if (!poItem) continue;

        // Update inventory stock
        const inventoryItem = await prismaAny.inventoryItem.findUnique({
          where: { id: receivedItem.itemId },
        });

        if (inventoryItem) {
          updates.push(
            prismaAny.inventoryItem.update({
              where: { id: receivedItem.itemId },
              data: {
                currentStock: inventoryItem.currentStock + receivedItem.quantityReceived,
              },
            })
          );

          // Create batch record
          updates.push(
            prismaAny.inventoryBatch.create({
              data: {
                itemId: receivedItem.itemId,
                batchNumber: receivedItem.batchNumber,
                quantity: receivedItem.quantityReceived,
                costPerUnit: poItem.unitCost,
                expirationDate: receivedItem.expirationDate ? new Date(receivedItem.expirationDate) : undefined,
                supplierId: po.supplierId,
              },
            })
          );

          // Create inventory transaction
          updates.push(
            prismaAny.inventoryTransaction.create({
              data: {
                itemId: receivedItem.itemId,
                transactionType: 'purchase',
                quantity: receivedItem.quantityReceived,
                unitCost: poItem.unitCost,
                totalCost: poItem.unitCost * receivedItem.quantityReceived,
                referenceType: 'purchase_order',
                referenceId: id,
                performedById: req.user?.id,
                notes: `Received from PO ${po.poNumber}`,
              },
            })
          );

          // Update PO item received quantity
          updates.push(
            prismaAny.purchaseOrderItem.update({
              where: { id: poItem.id },
              data: {
                quantityReceived: poItem.quantityReceived + receivedItem.quantityReceived,
              },
            })
          );
        }
      }

      // Execute all updates in transaction
      await prismaAny.$transaction(updates);

      // Update PO status
      const updatedPO = await prismaAny.purchaseOrder.update({
        where: { id },
        data: {
          status: 'received',
          actualDeliveryDate: new Date(),
        },
        include: {
          items: true,
        },
      });

      logger.info(`Inventory received for PO: ${po.poNumber}`);

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('inventory:received', updatedPO);

      res.json(updatedPO);

    } catch (error) {
      logger.error('Error receiving inventory:', error);
      res.status(500).json({ error: 'Failed to receive inventory' });
    }
  }

  /**
   * Get inventory valuation
   */
  static async getValuation(req: Request, res: Response) {
    try {
      const items = await prismaAny.inventoryItem.findMany({
        select: {
          id: true,
          name: true,
          currentStock: true,
          costPerUnit: true,
          sellingPrice: true,
        },
      });

      let totalCost = 0;
      let totalValue = 0;

      const valuedItems = items.map(item => {
        const cost = (item.costPerUnit || 0) * item.currentStock;
        const value = (item.sellingPrice || 0) * item.currentStock;
        
        totalCost += cost;
        totalValue += value;

        return {
          ...item,
          totalCost: cost,
          totalValue: value,
          potentialProfit: value - cost,
        };
      });

      res.json({
        items: valuedItems,
        summary: {
          totalItems: items.length,
          totalCost,
          totalRetailValue: totalValue,
          potentialProfit: totalValue - totalCost,
          markupPercentage: totalCost > 0 
            ? (((totalValue - totalCost) / totalCost) * 100).toFixed(2)
            : 0,
        },
      });

    } catch (error) {
      logger.error('Error calculating valuation:', error);
      res.status(500).json({ error: 'Failed to calculate valuation' });
    }
  }

  // Helper methods

  private static getStockStatus(item: any): string {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.minimumStock) return 'low_stock';
    if (item.optimalStock && item.currentStock >= item.optimalStock) return 'optimal';
    return 'in_stock';
  }

  private static async identifyItemsNeedingOrders(): Promise<any[]> {
    const items = await prismaAny.inventoryItem.findMany({
      where: {
        OR: [
          { currentStock: { lte: prismaAny.inventoryItem.fields.minimumStock } },
          { currentStock: 0 },
        ],
      },
      include: {
        batches: {
          orderBy: { expirationDate: 'asc' },
        },
      },
    });

    // Calculate recommended order quantity
    return items.map(item => {
      const recommendedQuantity = item.optimalStock 
        ? item.optimalStock - item.currentStock
        : (item.minimumStock * 2) - item.currentStock;

      return {
        ...item,
        recommendedOrderQuantity: Math.max(recommendedQuantity, 0),
        daysUntilStockout: this.estimateDaysUntilStockout(item),
      };
    });
  }

  private static estimateDaysUntilStockout(item: any): number {
    // This would use historical transaction data to estimate
    // For now, return a simple calculation
    return item.currentStock > 0 ? Math.floor(item.currentStock / 2) : 0;
  }

  private static async createAutoPurchaseOrder(item: any): Promise<void> {
    try {
      // Find preferred supplier (this would be more sophisticated in production)
      const supplier = await prismaAny.supplier.findFirst({
        where: { isActive: true },
      });

      if (!supplier) {
        logger.warn('No active supplier found for auto purchase order');
        return;
      }

      const recommendedQuantity = item.optimalStock 
        ? item.optimalStock - item.currentStock
        : (item.minimumStock * 3);

      // Create draft PO
      const poCount = await prismaAny.purchaseOrder.count();
      const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(6, '0')}-AUTO`;

      const unitCost = item.costPerUnit || 0;
      const subtotal = recommendedQuantity * unitCost;
      const tax = subtotal * 0.20;

      await prismaAny.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: supplier.id,
          status: 'draft',
          subtotal,
          tax,
          total: subtotal + tax,
          notes: `Auto-generated due to low stock alert for ${item.name}`,
          items: {
            create: [{
              itemId: item.id,
              quantityOrdered: recommendedQuantity,
              unitCost,
              totalCost: subtotal,
            }],
          },
        },
      });

      logger.info(`Auto purchase order created for ${item.name}: ${poNumber}`);

    } catch (error) {
      logger.error('Error creating auto purchase order:', error);
    }
  }
}
