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
