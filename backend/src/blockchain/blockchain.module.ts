import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [WalletModule, ConfigModule],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
