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
