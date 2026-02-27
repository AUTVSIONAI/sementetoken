import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripePayment } from './stripe-payment.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StripePayment]),
    ConfigModule,
    WalletModule,
  ],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
