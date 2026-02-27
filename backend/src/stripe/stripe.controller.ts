import { Controller, Post, Body, Req, Res, BadRequestException, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: { amount: number }, @Req() req: any) {
    const userId = req.user.userId; // Usually passport-jwt sets user or userId
    return this.stripeService.createCheckoutSession(body.amount, userId);
  }

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    
    // Check if rawBody is available (configured in main.ts)
    if (!req['rawBody']) {
        throw new BadRequestException('Raw body not available');
    }

    try {
      await this.stripeService.handleWebhook(sig as string, req['rawBody']);
      res.status(200).send({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}
