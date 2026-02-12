import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';

const prismaAny = prisma as any;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['veterinarian', 'nurse', 'receptionist', 'shop_staff', 'student', 'admin']),
  permissions: z.array(z.enum(['admin', 'owner', 'edit', 'read'])),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  salary: z.number().optional(),
  startDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export class AdminUserController {
  
  /**
   * Get all users with filtering and search
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phoneNumber: { contains: search as string } },
        ];
      }

      const [users, total] = await Promise.all([
        prismaAny.user.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy as string]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            permissions: true,
            phoneNumber: true,
            specialization: true,
            licenseNumber: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            _count: {
              select: {
                appointments: true,
                schedules: true,
              },
            },
          },
        }),
        prismaAny.user.count({ where }),
      ]);

      res.json({
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Get single user by ID
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prismaAny.user.findUnique({
        where: { id },
        include: {
          schedules: true,
          appointments: {
            take: 10,
            orderBy: { scheduledStart: 'desc' },
            include: {
              pet: {
                select: { name: true, species: true },
              },
              client: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          _count: {
            select: {
              appointments: true,
              generatedInvoices: true,
              approvedInvoices: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't send password hash
      const { passwordHash: _passwordHash, ...userData } = user;

      res.json(userData);

    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * Create new user
   */
  static async createUser(req: Request, res: Response) {
    try {
      const validated = createUserSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await prismaAny.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, 12);

      // Create user
      const { password: _password, ...userData } = validated;
      const user = await prismaAny.user.create({
        data: {
          ...userData,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_USER',
          entityType: 'user',
          entityId: user.id,
          newValues: { email: user.email, role: user.role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`User created: ${user.email} by admin ${req.user?.id}`);

      res.status(201).json(user);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateUserSchema.parse(req.body);

      const oldUser = await prismaAny.user.findUnique({ where: { id } });
      if (!oldUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If email is being changed, check for duplicates
      if (validated.email && validated.email !== oldUser.email) {
        const existingEmail = await prismaAny.user.findUnique({
          where: { email: validated.email },
        });

        if (existingEmail) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      const user = await prismaAny.user.update({
        where: { id },
        data: validated,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          phoneNumber: true,
          specialization: true,
          licenseNumber: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_USER',
          entityType: 'user',
          entityId: user.id,
          oldValues: { role: oldUser.role, permissions: oldUser.permissions },
          newValues: { role: user.role, permissions: user.permissions },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`User updated: ${user.email} by admin ${req.user?.id}`);

      res.json(user);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user?.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const user = await prismaAny.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_USER',
          entityType: 'user',
          entityId: user.id,
          oldValues: { isActive: true },
          newValues: { isActive: false },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`User deactivated: ${user.email} by admin ${req.user?.id}`);

      res.json({ message: 'User deactivated successfully' });

    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Permanently delete user (hard delete)
   */
  static async permanentlyDeleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { confirm } = req.body;

      if (confirm !== 'DELETE') {
        return res.status(400).json({ error: 'Confirmation required' });
      }

      // Prevent self-deletion
      if (id === req.user?.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const user = await prismaAny.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for dependencies
      const appointmentCount = await prismaAny.appointment.count({
        where: { assignedVetId: id },
      });

      if (appointmentCount > 0) {
        return res.status(400).json({
          error: `Cannot delete user with ${appointmentCount} associated appointments. Please reassign or delete them first.`,
        });
      }

      // Delete user
      await prismaAny.user.delete({ where: { id } });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'PERMANENT_DELETE_USER',
          entityType: 'user',
          entityId: id,
          oldValues: { email: user.email, role: user.role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.warn(`User permanently deleted: ${user.email} by admin ${req.user?.id}`);

      res.json({ message: 'User permanently deleted' });

    } catch (error) {
      logger.error('Error permanently deleting user:', error);
      res.status(500).json({ error: 'Failed to permanently delete user' });
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updatePasswordSchema.parse(req.body);

      const user = await prismaAny.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password (only if user is updating their own password)
      if (id === req.user?.id) {
        const isValid = await bcrypt.compare(validated.currentPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(validated.newPassword, 12);

      await prismaAny.user.update({
        where: { id },
        data: { passwordHash: newPasswordHash },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_PASSWORD',
          entityType: 'user',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Password updated for user: ${user.email}`);

      res.json({ message: 'Password updated successfully' });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      logger.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }

  /**
   * Update user permissions
   */
  static async updatePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }

      const validPermissions = ['admin', 'owner', 'edit', 'read'];
      const invalid = permissions.filter(p => !validPermissions.includes(p));

      if (invalid.length > 0) {
        return res.status(400).json({ error: `Invalid permissions: ${invalid.join(', ')}` });
      }

      const user = await prismaAny.user.update({
        where: { id },
        data: { permissions },
        select: {
          id: true,
          email: true,
          role: true,
          permissions: true,
        },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_PERMISSIONS',
          entityType: 'user',
          entityId: id,
          newValues: { permissions },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Permissions updated for user: ${user.email}`);

      res.json(user);

    } catch (error) {
      logger.error('Error updating permissions:', error);
      res.status(500).json({ error: 'Failed to update permissions' });
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const [
        totalAppointments,
        completedAppointments,
        generatedInvoices,
        approvedInvoices,
        averageRating,
      ] = await Promise.all([
        prismaAny.appointment.count({ where: { assignedVetId: id } }),
        prismaAny.appointment.count({ where: { assignedVetId: id, status: 'completed' } }),
        prismaAny.invoice.count({ where: { generatedById: id } }),
        prismaAny.invoice.count({ where: { approvedById: id } }),
        // Placeholder for rating system
        Promise.resolve(4.5),
      ]);

      res.json({
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          completionRate: totalAppointments > 0 
            ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
            : 0,
        },
        invoices: {
          generated: generatedInvoices,
          approved: approvedInvoices,
        },
        performance: {
          averageRating,
        },
      });

    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  /**
   * Bulk update user roles
   */
  static async bulkUpdateRoles(req: Request, res: Response) {
    try {
      const { userIds, role } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'userIds must be a non-empty array' });
      }

      const validRoles = ['veterinarian', 'nurse', 'receptionist', 'shop_staff', 'student', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const result = await prismaAny.user.updateMany({
        where: { id: { in: userIds } },
        data: { role },
      });

      // Log audit trail
      await prismaAny.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'BULK_UPDATE_ROLES',
          entityType: 'user',
          newValues: { userIds, role, count: result.count },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`Bulk role update: ${result.count} users updated to ${role}`);

      res.json({ message: `${result.count} users updated successfully` });

    } catch (error) {
      logger.error('Error bulk updating roles:', error);
      res.status(500).json({ error: 'Failed to bulk update roles' });
    }
  }
}
