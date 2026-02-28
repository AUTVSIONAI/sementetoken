import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreeExperience } from './tree-experience.entity';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { TreesModule } from '../trees/trees.module';

@Module({
  imports: [TypeOrmModule.forFeature([TreeExperience]), TreesModule],
  controllers: [ExperienceController],
  providers: [ExperienceService],
})
export class ExperienceModule {}
