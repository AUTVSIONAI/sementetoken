import { Controller, Get, Post, Body, UseGuards, Delete, Param, Put } from '@nestjs/common';
import { TourismService } from './tourism.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('tourism')
export class TourismController {
  constructor(private readonly tourismService: TourismService) {}

  @Get('flights')
  async getFlights() {
    // Mock data
    return [
      { id: 1, airline: 'EcoWings', from: 'GRU', to: 'MAO', price: 1200, carbonOffset: 'Included' },
      { id: 2, airline: 'GreenAir', from: 'GIG', to: 'MAO', price: 1150, carbonOffset: 'Included' },
    ];
  }

  @Get('hotels')
  async getHotels() {
    // Mock data
    return [
      { id: 1, name: 'Amazon EcoLodge', rating: 4.8, pricePerNight: 450, ecoCertified: true },
      { id: 2, name: 'Forest Retreat', rating: 4.5, pricePerNight: 380, ecoCertified: true },
    ];
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('partners')
  async getPartners() {
    return this.tourismService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('partners')
  async createPartner(@Body() body: any) {
    return this.tourismService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('partners/:id')
  async updatePartner(@Param('id') id: string, @Body() body: any) {
    return this.tourismService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('partners/:id')
  async removePartner(@Param('id') id: string) {
    return this.tourismService.remove(id);
  }
}
