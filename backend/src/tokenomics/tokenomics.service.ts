import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenomicsService {
  constructor(private configService: ConfigService) {}

  calculateDistribution(amount: number) {
    const platformPercent = this.configService.get<number>('PLATFORM_PERCENT') || 40;
    const expansionPercent = this.configService.get<number>('EXPANSION_PERCENT') || 30;
    const brigadePercent = this.configService.get<number>('BRIGADE_PERCENT') || 30;

    const platform = (amount * platformPercent) / 100;
    const expansion = (amount * expansionPercent) / 100;
    const brigade = (amount * brigadePercent) / 100;

    return {
      platform,
      expansion,
      brigade,
      total: amount,
      breakdown: {
        platformPercent,
        expansionPercent,
        brigadePercent
      }
    };
  }

  getTreePricing() {
    return {
      baseCost: this.configService.get<number>('TREE_BASE_COST') || 50,
      salePrice: this.configService.get<number>('TREE_SALE_PRICE') || 100,
    };
  }
}
