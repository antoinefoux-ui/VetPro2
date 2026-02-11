/**
 * External API Integration Services
 * Complete implementations for SendGrid, Twilio, Stripe, and Slovak eKasa
 */

import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import Stripe from 'stripe';
import axios from 'axios';
import logger from '../utils/logger';

// ============================================
// SENDGRID EMAIL SERVICE
// ============================================

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export class EmailService {
  
  /**
   * Send appointment confirmation email
   */
  static async sendAppointmentConfirmation(data: {
    to: string;
    clientName: string;
    petName: string;
    appointmentDate: Date;
    veterinarian: string;
    appointmentType: string;
  }) {
    try {
      const msg = {
        to: data.to,
        from: process.env.EMAIL_FROM || 'noreply@vetpro.com',
        subject: `Appointment Confirmation - ${data.petName}`,
        html: `
          <h2>Appointment Confirmed</h2>
          <p>Dear ${data.clientName},</p>
          <p>Your appointment has been confirmed for <strong>${data.petName}</strong>.</p>
          <ul>
            <li><strong>Date:</strong> ${data.appointmentDate.toLocaleString()}</li>
            <li><strong>Type:</strong> ${data.appointmentType}</li>
            <li><strong>Veterinarian:</strong> ${data.veterinarian}</li>
          </ul>
          <p>Please arrive 10 minutes early for check-in.</p>
          <p>If you need to reschedule, please call us at least 24 hours in advance.</p>
          <p>Thank you!</p>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Appointment confirmation sent to ${data.to}`);
    } catch (error) {
      logger.error('Error sending appointment confirmation:', error);
      throw error;
    }
  }

  /**
   * Send appointment reminder
   */
  static async sendAppointmentReminder(data: {
    to: string;
    clientName: string;
    petName: string;
    appointmentDate: Date;
    veterinarian: string;
  }) {
    try {
      const msg = {
        to: data.to,
        from: process.env.EMAIL_FROM || 'noreply@vetpro.com',
        subject: `Reminder: Appointment Tomorrow - ${data.petName}`,
        html: `
          <h2>Appointment Reminder</h2>
          <p>Dear ${data.clientName},</p>
          <p>This is a friendly reminder about your appointment tomorrow for <strong>${data.petName}</strong>.</p>
          <p><strong>Date:</strong> ${data.appointmentDate.toLocaleString()}</p>
          <p><strong>Veterinarian:</strong> ${data.veterinarian}</p>
          <p>See you tomorrow!</p>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Appointment reminder sent to ${data.to}`);
    } catch (error) {
      logger.error('Error sending appointment reminder:', error);
    }
  }

  /**
   * Send invoice email
   */
  static async sendInvoice(data: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    pdfUrl?: string;
  }) {
    try {
      const msg = {
        to: data.to,
        from: process.env.EMAIL_FROM || 'noreply@vetpro.com',
        subject: `Invoice ${data.invoiceNumber}`,
        html: `
          <h2>Invoice</h2>
          <p>Dear ${data.clientName},</p>
          <p>Please find your invoice below:</p>
          <ul>
            <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
            <li><strong>Amount:</strong> €${data.amount.toFixed(2)}</li>
          </ul>
          ${data.pdfUrl ? `<p><a href="${data.pdfUrl}">Download PDF Invoice</a></p>` : ''}
          <p>Thank you for your business!</p>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Invoice sent to ${data.to}`);
    } catch (error) {
      logger.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Send newsletter
   */
  static async sendNewsletter(data: {
    to: string[];
    subject: string;
    content: string;
  }) {
    try {
      const msg = {
        to: data.to,
        from: process.env.EMAIL_FROM || 'noreply@vetpro.com',
        subject: data.subject,
        html: data.content,
      };

      await sgMail.sendMultiple(msg);
      logger.info(`Newsletter sent to ${data.to.length} recipients`);
    } catch (error) {
      logger.error('Error sending newsletter:', error);
      throw error;
    }
  }
}

// ============================================
// TWILIO SMS SERVICE
// ============================================

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class SMSService {
  
  /**
   * Send appointment reminder SMS
   */
  static async sendAppointmentReminder(data: {
    to: string;
    petName: string;
    appointmentDate: Date;
  }) {
    try {
      const message = await twilioClient.messages.create({
        body: `Reminder: ${data.petName}'s appointment is tomorrow at ${data.appointmentDate.toLocaleTimeString()}. Reply CONFIRM to confirm or CANCEL to cancel.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.to,
      });

      logger.info(`SMS reminder sent to ${data.to}: ${message.sid}`);
      return message;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send payment receipt SMS
   */
  static async sendPaymentReceipt(data: {
    to: string;
    amount: number;
    invoiceNumber: string;
  }) {
    try {
      const message = await twilioClient.messages.create({
        body: `Payment received: €${data.amount} for invoice ${data.invoiceNumber}. Thank you!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.to,
      });

      logger.info(`Payment receipt SMS sent to ${data.to}`);
      return message;
    } catch (error) {
      logger.error('Error sending payment SMS:', error);
      throw error;
    }
  }

  /**
   * Send general notification
   */
  static async sendNotification(data: {
    to: string;
    message: string;
  }) {
    try {
      const message = await twilioClient.messages.create({
        body: data.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.to,
      });

      logger.info(`SMS notification sent to ${data.to}`);
      return message;
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
      throw error;
    }
  }
}

// ============================================
// STRIPE PAYMENT SERVICE
// ============================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  
  /**
   * Create payment intent
   */
  static async createPaymentIntent(data: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: any;
  }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency,
        customer: data.customerId,
        metadata: data.metadata,
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(data: {
    email: string;
    name: string;
    phone?: string;
    metadata?: any;
  }) {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async refund(data: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount ? Math.round(data.amount * 100) : undefined,
        reason: data.reason as any,
      });

      logger.info(`Refund processed: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Create subscription (for payment plans)
   */
  static async createSubscription(data: {
    customerId: string;
    priceId: string;
    metadata?: any;
  }) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        metadata: data.metadata,
      });

      logger.info(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }
}

// ============================================
// SLOVAK eKASA (CHUD) SERVICE
// ============================================

export class EKasaService {
  
  private static apiUrl = process.env.EKASA_API_URL || '';
  private static apiKey = process.env.EKASA_API_KEY || '';
  private static businessId = process.env.EKASA_BUSINESS_ID || '';

  /**
   * Register fiscal receipt (Slovak requirement)
   */
  static async registerFiscalReceipt(data: {
    invoiceNumber: string;
    amount: number;
    vatAmount: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
    }>;
    paymentMethod: string;
  }) {
    try {
      const receiptData = {
        businessId: this.businessId,
        receiptNumber: data.invoiceNumber,
        issueDate: new Date().toISOString(),
        totalAmount: data.amount,
        vatAmount: data.vatAmount,
        paymentMethod: data.paymentMethod,
        items: data.items.map(item => ({
          name: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };

      const response = await axios.post(
        `${this.apiUrl}/receipts`,
        receiptData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const okpCode = response.data.okp; // Security code
      const receiptId = response.data.receiptId;

      logger.info(`Fiscal receipt registered: ${receiptId}, OKP: ${okpCode}`);

      return {
        receiptId,
        okpCode,
        qrCode: response.data.qrCode,
        printData: response.data.printData,
      };

    } catch (error: any) {
      logger.error('Error registering fiscal receipt:', error);
      throw new Error(`eKasa registration failed: ${error.message}`);
    }
  }

  /**
   * Print fiscal receipt to CHUD device
   */
  static async printReceipt(data: {
    receiptId: string;
    printData: string;
  }) {
    try {
      // This would send print command to physical CHUD device
      // Implementation depends on device API/driver
      
      const response = await axios.post(
        `${this.apiUrl}/print`,
        {
          receiptId: data.receiptId,
          printData: data.printData,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      logger.info(`Receipt printed: ${data.receiptId}`);
      return response.data;

    } catch (error) {
      logger.error('Error printing receipt:', error);
      throw error;
    }
  }

  /**
   * Get daily report (required by Slovak law)
   */
  static async getDailyReport(date: Date) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/reports/daily`,
        {
          params: {
            businessId: this.businessId,
            date: date.toISOString().split('T')[0],
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;

    } catch (error) {
      logger.error('Error fetching daily report:', error);
      throw error;
    }
  }

  /**
   * Close cash register day (end of day procedure)
   */
  static async closeCashRegister() {
    try {
      const response = await axios.post(
        `${this.apiUrl}/cash-register/close`,
        {
          businessId: this.businessId,
          closingTime: new Date().toISOString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      logger.info('Cash register closed for the day');
      return response.data;

    } catch (error) {
      logger.error('Error closing cash register:', error);
      throw error;
    }
  }
}

// ============================================
// EXPORT ALL SERVICES
// ============================================

export default {
  Email: EmailService,
  SMS: SMSService,
  Payment: PaymentService,
  EKasa: EKasaService,
};
