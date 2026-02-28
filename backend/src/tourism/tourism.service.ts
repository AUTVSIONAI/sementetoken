import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelPartner } from './travel-partner.entity';

@Injectable()
export class TourismService {
  constructor(
    @InjectRepository(TravelPartner)
    private travelPartnerRepository: Repository<TravelPartner>,
  ) {}

  async findAll() {
    return this.travelPartnerRepository.find();
  }

  async create(data: Partial<TravelPartner>) {
    const partner = this.travelPartnerRepository.create(data);
    return this.travelPartnerRepository.save(partner);
  }

  async update(id: string, data: Partial<TravelPartner>) {
    await this.travelPartnerRepository.update(id, data);
    return this.travelPartnerRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.travelPartnerRepository.delete(id);
  }
}
