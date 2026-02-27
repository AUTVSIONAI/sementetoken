import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripePayment } from './stripe-payment.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(StripePayment)
    private paymentRepository: Repository<StripePayment>,
    private walletService: WalletService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set');
    }
  }

  async createCheckoutSession(amount: number, userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Convert amount to cents (BRL)
    const amountInCents = Math.round(amount * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Tokens SementeToken (SEME)',
              description: 'Plataforma tecnológica de impacto ambiental. Compra de tokens utilitários para plantio rastreável.',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://sementetoken.com/success',
      cancel_url: 'https://sementetoken.com/cancel',
      metadata: {
        userId,
        amount: amount.toString(),
      },
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.processPaymentSuccess(session);
    }

    return { received: true };
  }

  private async processPaymentSuccess(session: Stripe.Checkout.Session) {
    const userId = session.metadata.userId;
    const amount = parseFloat(session.metadata.amount);
    const tokensAmount = amount; // 1 BRL = 1 SEME (assumed)

    // Check if payment already processed
    const existingPayment = await this.paymentRepository.findOne({ where: { stripeSessionId: session.id } });
    if (existingPayment) {
        this.logger.warn(`Payment ${session.id} already processed`);
        return;
    }

    const payment = this.paymentRepository.create({
      userId,
      stripeSessionId: session.id,
      amount,
      tokensAmount,
      status: 'paid',
    });

    await this.paymentRepository.save(payment);
    
    // Update internal balance (Seed Token)
    try {
      await this.walletService.adjustSeedBalance(userId, tokensAmount);
      this.logger.log(`Added ${tokensAmount} SEME to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update balance for user ${userId}: ${error.message}`);
    }
  }
}
