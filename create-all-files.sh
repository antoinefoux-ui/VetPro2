#!/bin/bash

BASE_DIR="/mnt/user-data/outputs/vetpro-complete-all"

# Create all missing service files
mkdir -p $BASE_DIR/backend/src/services

cat > $BASE_DIR/backend/src/services/email.service.ts << 'EOF'
import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

const API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@vetpro.com';

if (API_KEY) sgMail.setApiKey(API_KEY);

export class EmailService {
  static async sendEmail(to: string, subject: string, html: string) {
    if (!API_KEY) {
      logger.warn('SendGrid API key not configured');
      return;
    }
    try {
      await sgMail.send({ to, from: FROM_EMAIL, subject, html });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error('Email send error:', error);
    }
  }

  static async sendInvoice(to: string, invoiceNumber: string, amount: number) {
    const html = `<h1>Invoice ${invoiceNumber}</h1><p>Total: €${amount.toFixed(2)}</p>`;
    await this.sendEmail(to, `Invoice ${invoiceNumber}`, html);
  }

  static async sendAppointmentReminder(to: string, appointmentDate: string) {
    const html = `<p>Reminder: You have an appointment on ${appointmentDate}</p>`;
    await this.sendEmail(to, 'Appointment Reminder', html);
  }
}
EOF

cat > $BASE_DIR/backend/src/services/sms.service.ts << 'EOF'
import twilio from 'twilio';
import logger from '../utils/logger';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

const client = ACCOUNT_SID && AUTH_TOKEN ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

export class SMSService {
  static async sendSMS(to: string, message: string) {
    if (!client) {
      logger.warn('Twilio not configured');
      return;
    }
    try {
      await client.messages.create({ body: message, from: PHONE_NUMBER, to });
      logger.info(`SMS sent to ${to}`);
    } catch (error) {
      logger.error('SMS send error:', error);
    }
  }

  static async sendAppointmentReminder(to: string, date: string) {
    await this.sendSMS(to, `Reminder: Appointment on ${date}. Reply CONFIRM to confirm.`);
  }
}
EOF

cat > $BASE_DIR/backend/src/services/payment.service.ts << 'EOF'
import Stripe from 'stripe';
import logger from '../utils/logger';

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' }) : null;

export class PaymentService {
  static async createPaymentIntent(amount: number, currency = 'eur') {
    if (!stripe) throw new Error('Stripe not configured');
    try {
      const intent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency });
      return intent;
    } catch (error) {
      logger.error('Payment intent error:', error);
      throw error;
    }
  }

  static async refund(paymentIntentId: string, amount?: number) {
    if (!stripe) throw new Error('Stripe not configured');
    return await stripe.refunds.create({ payment_intent: paymentIntentId, amount: amount ? Math.round(amount * 100) : undefined });
  }
}
EOF

# Create middleware
mkdir -p $BASE_DIR/backend/src/middleware

cat > $BASE_DIR/backend/src/middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
  };
}
EOF

# Create config
mkdir -p $BASE_DIR/backend/src/config

cat > $BASE_DIR/backend/src/config/database.ts << 'EOF'
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/vetpro',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
};
EOF

cat > $BASE_DIR/backend/src/config/app.ts << 'EOF'
export const appConfig = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
EOF

# Create seed file
mkdir -p $BASE_DIR/backend/prisma

cat > $BASE_DIR/backend/prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@vetpro.com' },
    update: {},
    create: {
      email: 'admin@vetpro.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: ['admin'],
    },
  });

  console.log('✓ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

echo "✓ All backend service and config files created"

