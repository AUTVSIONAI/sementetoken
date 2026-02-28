import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelPartner } from './travel-partner.entity';
import { TourismController } from './tourism.controller';
import { TourismService } from './tourism.service';

@Module({
  imports: [TypeOrmModule.forFeature([TravelPartner])],
  controllers: [TourismController],
  providers: [TourismService],
})
export class TourismModule {}
