import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @UseGuards(JwtAuthGuard)
  @Get('eligibility')
  async checkEligibility(@Req() req: any) {
    return this.experienceService.checkEligibility(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('events')
  async getEvents() {
    return this.experienceService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('events')
  async createEvent(@Body() body: any) {
    return this.experienceService.createEvent(body);
  }
}
