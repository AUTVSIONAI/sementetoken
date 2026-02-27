import { Module } from '@nestjs/common';
import { EsgService } from './esg.service';
import { EsgController } from './esg.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tree } from '../trees/tree.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tree, User])],
  controllers: [EsgController],
  providers: [EsgService],
  exports: [EsgService],
})
export class EsgModule {}
