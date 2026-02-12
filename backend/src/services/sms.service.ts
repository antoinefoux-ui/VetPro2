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
