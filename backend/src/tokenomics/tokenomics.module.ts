import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenomicsService } from './tokenomics.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TokenomicsService],
  exports: [TokenomicsService],
})
export class TokenomicsModule {}
