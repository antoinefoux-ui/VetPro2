import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import logger from '../utils/logger';


const practiceSettingsSchema = z.object({
  practiceName: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  website: z.string().url().optional(),
  taxId: z.string().optional(),
  businessLicense: z.string().optional(),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(true) }),
  }),
  currency: z.string().default('EUR'),
  timezone: z.string().default('Europe/Bratislava'),
  language: z.string().default('sk'),
});

const roomSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['examination', 'surgery', 'xray', 'laboratory', 'waiting', 'pharmacy', 'storage']),
  capacity: z.number().int().positive().default(1),
  equipment: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

const equipmentSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  lastMaintenanceDate: z.string().datetime().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  status: z.enum(['operational', 'maintenance', 'broken', 'retired']).default('operational'),
  assignedRoomId: z.string().optional(),
  notes: z.string().optional(),
});

const eshopSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  storeName: z.string(),
  storeDescription: z.string().optional(),
  currency: z.string().default('EUR'),
  taxRate: z.number().default(20),
  shippingEnabled: z.boolean().default(true),
  freeShippingThreshold: z.number().optional(),
  shippingFee: z.number().default(5.00),
  paymentMethods: z.array(z.enum(['card', 'bank_transfer', 'cash', 'paypal'])).default(['card']),
  returnPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  privacyPolicy: z.string().optional(),
});

const physicalShopSchema = z.object({
  enabled: z.boolean().default(true),
  location: z.string(),
  openingHours: z.string(),
  contactNumber: z.string(),
  manager: z.string().optional(),
  inventory: z.string().optional(),
  notes: z.string().optional(),
});

export class AdminSettingsController {
  
  /**
   * Get practice settings
   */
  static async getPracticeSettings(req: Request, res: Response) {
    try {
      let settings = await prismaAny.practiceSettings.findFirst();

      if (!settings) {
        // Create default settings
        settings = await prismaAny.practiceSettings.create({
          data: {
            practiceName: 'VetPro Clinic',
            email: 'contact@vetpro.com',
            phone: '+421 XXX XXX XXX',
            address: '',
            city: '',
            postalCode: '',
            country: 'Slovakia',
            currency: 'EUR',
            timezone: 'Europe/Bratislava',
            language: 'sk',
            openingHours: {
              monday: { open: '08:00', close: '18:00', closed: false },
              tuesday: { open: '08:00', close: '18:00', closed: false },
              wednesday: { open: '08:00', close: '18:00', closed: false },
              thursday: { open: '08:00', close: '18:00', closed: false },
              friday: { open: '08:00', close: '18:00', closed: false },
              saturday: { open: '09:00', close: '14:00', closed: false },
              sunday: { open: '00:00', close: '00:00', closed: true },
            },
          },
        });
      }

      res.json(settings);

    } catch (error) {
      logger.error('Error fetching practice settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  /**
   * Update practice settings
   */
  static async updatePracticeSettings(req: Request, res: Response) {
    try {
      const validated = practiceSettingsSchema.partial().parse(req.body);

      const settings = await prismaAny.practiceSettings.upsert({
        where: { id: req.body.id || 'default' },
        update: validated,
        create: validated as any,
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_PRACTICE_SETTINGS',
          entityType: 'settings',
          entityId: settings.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Practice settings updated by admin ${req.user?.id}`);

      res.json(settings);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error updating practice settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  // ============ ROOMS MANAGEMENT ============

  /**
   * Get all rooms
   */
  static async getAllRooms(req: Request, res: Response) {
    try {
      const { type, isActive } = req.query;

      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const rooms = await prismaAny.room.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          currentAppointments: {
            where: {
              status: { in: ['checked_in', 'in_progress'] },
            },
            include: {
              pet: { select: { name: true } },
              vet: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      res.json(rooms);

    } catch (error) {
      logger.error('Error fetching rooms:', error);
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  }

  /**
   * Create room
   */
  static async createRoom(req: Request, res: Response) {
    try {
      const validated = roomSchema.parse(req.body);

      const room = await prismaAny.room.create({
        data: validated,
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_ROOM',
          entityType: 'room',
          entityId: room.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Room created: ${room.name} by admin ${req.user?.id}`);

      res.status(201).json(room);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  }

  /**
   * Update room
   */
  static async updateRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = roomSchema.partial().parse(req.body);

      const room = await prismaAny.room.update({
        where: { id },
        data: validated,
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_ROOM',
          entityType: 'room',
          entityId: room.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Room updated: ${room.name}`);

      res.json(room);

    } catch (error) {
      logger.error('Error updating room:', error);
      res.status(500).json({ error: 'Failed to update room' });
    }
  }

  /**
   * Delete room
   */
  static async deleteRoom(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check for active appointments in room
      const activeAppointments = await prismaAny.appointment.count({
        where: {
          roomNumber: id,
          status: { in: ['scheduled', 'checked_in', 'in_progress'] },
        },
      });

      if (activeAppointments > 0) {
        return res.status(400).json({
          error: `Cannot delete room with ${activeAppointments} active appointments`,
        });
      }

      await prismaAny.room.delete({ where: { id } });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_ROOM',
          entityType: 'room',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Room deleted: ${id}`);

      res.json({ message: 'Room deleted successfully' });

    } catch (error) {
      logger.error('Error deleting room:', error);
      res.status(500).json({ error: 'Failed to delete room' });
    }
  }

  // ============ EQUIPMENT MANAGEMENT ============

  /**
   * Get all equipment
   */
  static async getAllEquipment(req: Request, res: Response) {
    try {
      const { status, type, roomId } = req.query;

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (roomId) where.assignedRoomId = roomId;

      const equipment = await prismaAny.equipment.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          assignedRoom: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      });

      res.json(equipment);

    } catch (error) {
      logger.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment' });
    }
  }

  /**
   * Create equipment
   */
  static async createEquipment(req: Request, res: Response) {
    try {
      const validated = equipmentSchema.parse(req.body);

      const equipment = await prismaAny.equipment.create({
        data: {
          ...validated,
          purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
          warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : undefined,
          lastMaintenanceDate: validated.lastMaintenanceDate ? new Date(validated.lastMaintenanceDate) : undefined,
          nextMaintenanceDate: validated.nextMaintenanceDate ? new Date(validated.nextMaintenanceDate) : undefined,
        },
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_EQUIPMENT',
          entityType: 'equipment',
          entityId: equipment.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Equipment created: ${equipment.name}`);

      res.status(201).json(equipment);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error creating equipment:', error);
      res.status(500).json({ error: 'Failed to create equipment' });
    }
  }

  /**
   * Update equipment
   */
  static async updateEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = equipmentSchema.partial().parse(req.body);

      const equipment = await prismaAny.equipment.update({
        where: { id },
        data: {
          ...validated,
          purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
          warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : undefined,
          lastMaintenanceDate: validated.lastMaintenanceDate ? new Date(validated.lastMaintenanceDate) : undefined,
          nextMaintenanceDate: validated.nextMaintenanceDate ? new Date(validated.nextMaintenanceDate) : undefined,
        },
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_EQUIPMENT',
          entityType: 'equipment',
          entityId: equipment.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(equipment);

    } catch (error) {
      logger.error('Error updating equipment:', error);
      res.status(500).json({ error: 'Failed to update equipment' });
    }
  }

  /**
   * Delete equipment
   */
  static async deleteEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prismaAny.equipment.delete({ where: { id } });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_EQUIPMENT',
          entityType: 'equipment',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Equipment deleted: ${id}`);

      res.json({ message: 'Equipment deleted successfully' });

    } catch (error) {
      logger.error('Error deleting equipment:', error);
      res.status(500).json({ error: 'Failed to delete equipment' });
    }
  }

  // ============ E-SHOP SETTINGS ============

  /**
   * Get e-shop settings
   */
  static async getEshopSettings(req: Request, res: Response) {
    try {
      let settings = await prismaAny.eshopSettings.findFirst();

      if (!settings) {
        settings = await prismaAny.eshopSettings.create({
          data: {
            enabled: true,
            storeName: 'VetPro Shop',
            currency: 'EUR',
            taxRate: 20,
            shippingEnabled: true,
            shippingFee: 5.00,
            paymentMethods: ['card'],
          },
        });
      }

      res.json(settings);

    } catch (error) {
      logger.error('Error fetching e-shop settings:', error);
      res.status(500).json({ error: 'Failed to fetch e-shop settings' });
    }
  }

  /**
   * Update e-shop settings
   */
  static async updateEshopSettings(req: Request, res: Response) {
    try {
      const validated = eshopSettingsSchema.partial().parse(req.body);

      const settings = await prismaAny.eshopSettings.upsert({
        where: { id: req.body.id || 'default' },
        update: validated,
        create: validated as any,
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_ESHOP_SETTINGS',
          entityType: 'settings',
          entityId: settings.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(settings);

    } catch (error) {
      logger.error('Error updating e-shop settings:', error);
      res.status(500).json({ error: 'Failed to update e-shop settings' });
    }
  }

  // ============ PHYSICAL SHOP SETTINGS ============

  /**
   * Get physical shop settings
   */
  static async getPhysicalShopSettings(req: Request, res: Response) {
    try {
      let settings = await prismaAny.physicalShopSettings.findFirst();

      if (!settings) {
        settings = await prismaAny.physicalShopSettings.create({
          data: {
            enabled: true,
            location: 'Main Practice',
            openingHours: 'Mon-Fri 8:00-18:00',
            contactNumber: '+421 XXX XXX XXX',
          },
        });
      }

      res.json(settings);

    } catch (error) {
      logger.error('Error fetching physical shop settings:', error);
      res.status(500).json({ error: 'Failed to fetch physical shop settings' });
    }
  }

  /**
   * Update physical shop settings
   */
  static async updatePhysicalShopSettings(req: Request, res: Response) {
    try {
      const validated = physicalShopSchema.partial().parse(req.body);

      const settings = await prismaAny.physicalShopSettings.upsert({
        where: { id: req.body.id || 'default' },
        update: validated,
        create: validated as any,
      });

      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_PHYSICAL_SHOP_SETTINGS',
          entityType: 'settings',
          entityId: settings.id,
          newValues: validated,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.json(settings);

    } catch (error) {
      logger.error('Error updating physical shop settings:', error);
      res.status(500).json({ error: 'Failed to update physical shop settings' });
    }
  }

  /**
   * Get system overview/statistics
   */
  static async getSystemOverview(req: Request, res: Response) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalRooms,
        totalEquipment,
        maintenanceDue,
        totalClients,
        totalPets,
      ] = await Promise.all([
        prismaAny.user.count(),
        prismaAny.user.count({ where: { isActive: true } }),
        prismaAny.room.count(),
        prismaAny.equipment.count(),
        prismaAny.equipment.count({
          where: {
            nextMaintenanceDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            status: 'operational',
          },
        }),
        prismaAny.client.count({ where: { isActive: true } }),
        prismaAny.pet.count({ where: { isDeceased: false } }),
      ]);

      res.json({
        users: { total: totalUsers, active: activeUsers },
        infrastructure: { rooms: totalRooms, equipment: totalEquipment, maintenanceDue },
        patients: { clients: totalClients, pets: totalPets },
      });

    } catch (error) {
      logger.error('Error fetching system overview:', error);
      res.status(500).json({ error: 'Failed to fetch system overview' });
    }
  }
}
