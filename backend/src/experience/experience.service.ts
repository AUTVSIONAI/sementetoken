import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreeExperience } from './tree-experience.entity';
import { TreesService } from '../trees/trees.service';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectRepository(TreeExperience)
    private experienceRepository: Repository<TreeExperience>,
    private treesService: TreesService
  ) {}

  async checkEligibility(userId: string): Promise<{ eligible: boolean, count: number, required: number }> {
    const required = Number(process.env.MIN_TREES_FOR_EXPERIENCE) || 50;
    const count = await this.treesService.countForUser(userId);
    return {
      eligible: count >= required,
      count,
      required
    };
  }

  async findAll() {
    return this.experienceRepository.find();
  }

  async createEvent(data: Partial<TreeExperience>) {
    const event = this.experienceRepository.create(data);
    return this.experienceRepository.save(event);
  }
}
