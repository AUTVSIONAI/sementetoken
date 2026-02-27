import { Controller, Get, UseGuards } from '@nestjs/common';
import { EsgService } from './esg.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('esg')
export class EsgController {
  constructor(private readonly esgService: EsgService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'corporate')
  async getDashboard() {
    return this.esgService.getDashboardStats();
  }
}
