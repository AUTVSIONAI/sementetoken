import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeatureFlag)
    private featuresRepository: Repository<FeatureFlag>,
  ) {}

  async create(key: string, description: string, enabled: boolean): Promise<FeatureFlag> {
    const existing = await this.featuresRepository.findOne({ where: { key } });
    if (existing) {
      throw new Error('Feature flag already exists');
    }
    const feature = this.featuresRepository.create({ key, description, enabled });
    return this.featuresRepository.save(feature);
  }

  async remove(key: string): Promise<void> {
    await this.featuresRepository.delete(key);
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.featuresRepository.find();
  }

  async findOne(key: string): Promise<FeatureFlag> {
    return this.featuresRepository.findOne({ where: { key } });
  }

  async isEnabled(key: string): Promise<boolean> {
    const feature = await this.findOne(key);
    return feature ? feature.enabled : false;
  }

  async setStatus(key: string, enabled: boolean): Promise<FeatureFlag> {
    let feature = await this.findOne(key);
    if (!feature) {
      feature = this.featuresRepository.create({ key, enabled });
    } else {
      feature.enabled = enabled;
    }
    return this.featuresRepository.save(feature);
  }

  async createDefaultFlags() {
    const defaults = [
      { key: 'tourism_enabled', enabled: false, description: 'Enable Green Tourism module' },
      { key: 'experience_enabled', enabled: false, description: 'Enable Tree Planting Experience' },
      { key: 'corporate_lots_enabled', enabled: false, description: 'Enable Corporate Tree Lots' },
    ];

    for (const def of defaults) {
      const existing = await this.findOne(def.key);
      if (!existing) {
        await this.featuresRepository.save(this.featuresRepository.create(def));
      }
    }
  }
}
