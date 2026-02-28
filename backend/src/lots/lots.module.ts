import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeLot } from './tree-lot.entity';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { SeedTokenModule } from '../seed-token/seed-token.module';
import { TreesModule } from '../trees/trees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreeLot]),
    SeedTokenModule,
    TreesModule
  ],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService]
})
export class LotsModule {}
