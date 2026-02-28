import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EsgController } from './esg.controller';
import { EsgService } from './esg.service';
import { TreesModule } from '../trees/trees.module';
import { User } from '../users/user.entity';
import { TreeEstimate } from './tree-estimate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TreeEstimate]), TreesModule],
  controllers: [EsgController],
  providers: [EsgService],
})
export class EsgModule {}
