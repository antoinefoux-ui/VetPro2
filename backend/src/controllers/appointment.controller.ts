import { Request, Response } from "express";
import { prisma } from "../server";
import { z } from "zod";
import logger from "../utils/logger";

import { addMinutes, addHours, startOfDay, endOfDay, parseISO } from "date-fns";

const prismaAny = prisma as any;

const createAppointmentSchema = z.object({
  petId: z.string().uuid(),
  clientId: z.string().uuid(),
  assignedVetId: z.string().uuid().optional(),
  appointmentType: z.enum([
    "consultation",
    "surgery",
    "vaccination",
    "follow_up",
    "emergency",
    "grooming",
  ]),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  roomNumber: z.string().optional(),
  reason: z.string().optional(),
  specialInstructions: z.string().optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

export class AppointmentController {
  /**
   * Get all appointments with advanced filtering
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "50",
        vetId,
        clientId,
        petId,
        status,
        type,
        dateFrom,
        dateTo,
        roomNumber,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (vetId) where.assignedVetId = vetId;
      if (clientId) where.clientId = clientId;
      if (petId) where.petId = petId;
      if (status) where.status = status;
      if (type) where.appointmentType = type;
      if (roomNumber) where.roomNumber = roomNumber;

      if (dateFrom || dateTo) {
        where.scheduledStart = {};
        if (dateFrom) where.scheduledStart.gte = parseISO(dateFrom as string);
        if (dateTo) where.scheduledStart.lte = parseISO(dateTo as string);
      }

      const [appointments, total] = await Promise.all([
        prismaAny.appointment.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { scheduledStart: "asc" },
          include: {
            pet: {
              select: {
                name: true,
                species: true,
                breed: true,
              },
            },
            client: {
              select: {
                firstName: true,
                lastName: true,
                phonePrimary: true,
                email: true,
              },
            },
            vet: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        }),
        prismaAny.appointment.count({ where }),
      ]);

      res.json({
        data: appointments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  }

  /**
   * Get calendar view for specific date range
   */
  static async getCalendar(req: Request, res: Response) {
    try {
      const { startDate, endDate, vetId } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }

      const where: any = {
        scheduledStart: {
          gte: parseISO(startDate as string),
          lte: parseISO(endDate as string),
        },
      };

      if (vetId) {
        where.assignedVetId = vetId;
      }

      const appointments = await prismaAny.appointment.findMany({
        where,
        orderBy: { scheduledStart: "asc" },
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phonePrimary: true,
            },
          },
          vet: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Group by date and vet
      const calendar: any = {};

      for (const apt of appointments) {
        const date = apt.scheduledStart.toISOString().split("T")[0];
        if (!calendar[date]) {
          calendar[date] = {};
        }

        const vetKey = apt.assignedVetId || "unassigned";
        if (!calendar[date][vetKey]) {
          calendar[date][vetKey] = [];
        }

        calendar[date][vetKey].push(apt);
      }

      res.json({ calendar, appointments });
    } catch (error) {
      logger.error("Error fetching calendar:", error);
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  }

  /**
   * Get available time slots for booking
   */
  static async getAvailableSlots(req: Request, res: Response) {
    try {
      const { date, vetId, duration = "30" } = req.query;

      if (!date || !vetId) {
        return res.status(400).json({ error: "date and vetId are required" });
      }

      const durationMinutes = parseInt(duration as string);
      const targetDate = parseISO(date as string);

      // Get vet's schedule for the day
      const dayOfWeek = targetDate.getDay();
      const schedule = await prismaAny.schedule.findFirst({
        where: {
          userId: vetId as string,
          dayOfWeek,
        },
      });

      if (!schedule) {
        return res.json({ availableSlots: [] });
      }

      // Get existing appointments for the vet on this date
      const existingAppointments = await prismaAny.appointment.findMany({
        where: {
          assignedVetId: vetId as string,
          scheduledStart: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
          status: { notIn: ["cancelled", "no_show"] },
        },
        orderBy: { scheduledStart: "asc" },
      });

      // Generate time slots
      const slots: any[] = [];
      const startTime = new Date(targetDate);
      const [startHour, startMin] = schedule.startTime
        .toString()
        .split(":")
        .map(Number);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(targetDate);
      const [endHour, endMin] = schedule.endTime
        .toString()
        .split(":")
        .map(Number);
      endTime.setHours(endHour, endMin, 0, 0);

      let currentSlot = new Date(startTime);

      while (currentSlot < endTime) {
        const slotEnd = addMinutes(currentSlot, durationMinutes);

        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some((apt) => {
          return (
            (currentSlot >= apt.scheduledStart &&
              currentSlot < apt.scheduledEnd) ||
            (slotEnd > apt.scheduledStart && slotEnd <= apt.scheduledEnd) ||
            (currentSlot <= apt.scheduledStart && slotEnd >= apt.scheduledEnd)
          );
        });

        if (!hasConflict && slotEnd <= endTime) {
          slots.push({
            start: currentSlot.toISOString(),
            end: slotEnd.toISOString(),
            available: true,
          });
        }

        currentSlot = addMinutes(currentSlot, 15); // 15-minute intervals
      }

      res.json({ availableSlots: slots });
    } catch (error) {
      logger.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  }

  /**
   * Create new appointment with conflict detection
   */
  static async create(req: Request, res: Response) {
    try {
      const validated = createAppointmentSchema.parse(req.body);

      // Validate pet belongs to client
      const pet = await prismaAny.pet.findUnique({
        where: { id: validated.petId },
        include: { client: true },
      });

      if (!pet || pet.clientId !== validated.clientId) {
        return res
          .status(400)
          .json({ error: "Pet does not belong to this client" });
      }

      const scheduledStart = parseISO(validated.scheduledStart);
      const scheduledEnd = parseISO(validated.scheduledEnd);

      // Check for conflicts if vet is assigned
      if (validated.assignedVetId) {
        const conflicts = await prismaAny.appointment.findMany({
          where: {
            assignedVetId: validated.assignedVetId,
            status: { notIn: ["cancelled", "no_show"] },
            OR: [
              {
                scheduledStart: {
                  gte: scheduledStart,
                  lt: scheduledEnd,
                },
              },
              {
                scheduledEnd: {
                  gt: scheduledStart,
                  lte: scheduledEnd,
                },
              },
              {
                AND: [
                  { scheduledStart: { lte: scheduledStart } },
                  { scheduledEnd: { gte: scheduledEnd } },
                ],
              },
            ],
          },
        });

        if (conflicts.length > 0) {
          return res.status(409).json({
            error: "Time slot conflict detected",
            conflicts,
          });
        }
      }

      const appointment = await prismaAny.appointment.create({
        data: {
          ...validated,
          scheduledStart,
          scheduledEnd,
          status: "scheduled",
        },
        include: {
          pet: true,
          client: true,
          vet: true,
        },
      });

      // Send confirmation
      // TODO: Integrate with email/SMS service
      logger.info(`Appointment created: ${appointment.id} for ${pet.name}`);

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("appointment:created", appointment);

      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
      }
      logger.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  }

  /**
   * Get appointment by id
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const appointment = await prismaAny.appointment.findUnique({
        where: { id },
        include: {
          pet: true,
          client: true,
          vet: true,
          visitNotes: true,
          invoices: true,
        },
      });

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error) {
      logger.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  }

  /**
   * Delete appointment
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prismaAny.appointment.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  }

  /**
   * Update appointment
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateAppointmentSchema.parse(req.body);

      const existingAppointment = await prismaAny.appointment.findUnique({
        where: { id },
      });

      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // If rescheduling, check for conflicts
      if (
        validated.scheduledStart ||
        validated.scheduledEnd ||
        validated.assignedVetId
      ) {
        const scheduledStart = validated.scheduledStart
          ? parseISO(validated.scheduledStart)
          : existingAppointment.scheduledStart;

        const scheduledEnd = validated.scheduledEnd
          ? parseISO(validated.scheduledEnd)
          : existingAppointment.scheduledEnd;

        const vetId =
          validated.assignedVetId || existingAppointment.assignedVetId;

        if (vetId) {
          const conflicts = await prismaAny.appointment.findMany({
            where: {
              id: { not: id },
              assignedVetId: vetId,
              status: { notIn: ["cancelled", "no_show"] },
              OR: [
                {
                  scheduledStart: {
                    gte: scheduledStart,
                    lt: scheduledEnd,
                  },
                },
                {
                  scheduledEnd: {
                    gt: scheduledStart,
                    lte: scheduledEnd,
                  },
                },
              ],
            },
          });

          if (conflicts.length > 0) {
            return res.status(409).json({
              error: "Time slot conflict detected",
              conflicts,
            });
          }
        }
      }

      const appointment = await prismaAny.appointment.update({
        where: { id },
        data: {
          ...validated,
          ...(validated.scheduledStart && {
            scheduledStart: parseISO(validated.scheduledStart),
          }),
          ...(validated.scheduledEnd && {
            scheduledEnd: parseISO(validated.scheduledEnd),
          }),
        },
        include: {
          pet: true,
          client: true,
          vet: true,
        },
      });

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("appointment:updated", appointment);

      logger.info(`Appointment updated: ${id}`);

      res.json(appointment);
    } catch (error) {
      logger.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  }

  /**
   * Check in patient for appointment
   */
  static async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const appointment = await prismaAny.appointment.update({
        where: { id },
        data: {
          status: "checked_in",
          actualStart: new Date(),
        },
        include: {
          pet: true,
          client: true,
        },
      });

      // Notify assigned vet
      const io = req.app.get("io");
      io.emit("appointment:checked-in", appointment);

      logger.info(
        `Patient checked in: ${appointment.pet.name} for appointment ${id}`,
      );

      res.json(appointment);
    } catch (error) {
      logger.error("Error checking in appointment:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  }

  /**
   * Start appointment (vet begins consultation)
   */
  static async start(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const appointment = await prismaAny.appointment.update({
        where: { id },
        data: {
          status: "in_progress",
          actualStart: new Date(),
        },
      });

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("appointment:started", appointment);

      res.json(appointment);
    } catch (error) {
      logger.error("Error starting appointment:", error);
      res.status(500).json({ error: "Failed to start appointment" });
    }
  }

  /**
   * Complete appointment
   */
  static async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const appointment = await prismaAny.appointment.update({
        where: { id },
        data: {
          status: "completed",
          actualEnd: new Date(),
        },
        include: {
          visitNotes: true,
          invoices: true,
        },
      });

      // Check if visit notes exist
      if (!appointment.visitNotes || appointment.visitNotes.length === 0) {
        logger.warn(`Appointment ${id} completed without visit notes`);
      }

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("appointment:completed", appointment);

      // Send follow-up communication (TODO)
      // await sendFollowUpEmail(appointment);

      logger.info(`Appointment completed: ${id}`);

      res.json(appointment);
    } catch (error) {
      logger.error("Error completing appointment:", error);
      res.status(500).json({ error: "Failed to complete appointment" });
    }
  }

  /**
   * Cancel appointment
   */
  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await prismaAny.appointment.update({
        where: { id },
        data: {
          status: "cancelled",
          specialInstructions: reason ? `Cancelled: ${reason}` : "Cancelled",
        },
        include: {
          client: true,
          pet: true,
        },
      });

      // Send cancellation notification
      logger.info(`Appointment cancelled: ${id}`);

      // Emit real-time update
      const io = req.app.get("io");
      io.emit("appointment:cancelled", appointment);

      res.json(appointment);
    } catch (error) {
      logger.error("Error cancelling appointment:", error);
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  }

  /**
   * Get appointment statistics
   */
  static async getStatistics(req: Request, res: Response) {
    try {
      const { dateFrom, dateTo, vetId } = req.query;

      const where: any = {};

      if (dateFrom || dateTo) {
        where.scheduledStart = {};
        if (dateFrom) where.scheduledStart.gte = parseISO(dateFrom as string);
        if (dateTo) where.scheduledStart.lte = parseISO(dateTo as string);
      }

      if (vetId) {
        where.assignedVetId = vetId;
      }

      const [total, completed, cancelled, noShow, byType] = await Promise.all([
        prismaAny.appointment.count({ where }),
        prismaAny.appointment.count({
          where: { ...where, status: "completed" },
        }),
        prismaAny.appointment.count({
          where: { ...where, status: "cancelled" },
        }),
        prismaAny.appointment.count({ where: { ...where, status: "no_show" } }),
        prismaAny.appointment.groupBy({
          by: ["appointmentType"],
          where,
          _count: true,
        }),
      ]);

      res.json({
        total,
        completed,
        cancelled,
        noShow,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
        noShowRate: total > 0 ? ((noShow / total) * 100).toFixed(2) : 0,
        byType: byType.reduce((acc: any, item: any) => {
          acc[item.appointmentType] = item._count;
          return acc;
        }, {}),
      });
    } catch (error) {
      logger.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  }

  /**
   * Send appointment reminders
   */
  static async sendReminders(req: Request, res: Response) {
    try {
      const tomorrow = addHours(new Date(), 24);
      const dayAfter = addHours(tomorrow, 24);

      const appointments = await prismaAny.appointment.findMany({
        where: {
          scheduledStart: {
            gte: tomorrow,
            lte: dayAfter,
          },
          status: { in: ["scheduled", "confirmed"] },
          reminderSent: false,
        },
        include: {
          client: true,
          pet: true,
          vet: true,
        },
      });

      let sentCount = 0;

      for (const apt of appointments) {
        // TODO: Send email/SMS reminder
        // await sendAppointmentReminder(apt);

        await prismaAny.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        });

        sentCount++;
      }

      logger.info(`Sent ${sentCount} appointment reminders`);

      res.json({
        message: `${sentCount} reminders sent`,
        count: sentCount,
      });
    } catch (error) {
      logger.error("Error sending reminders:", error);
      res.status(500).json({ error: "Failed to send reminders" });
    }
  }
}

export default AppointmentController;
