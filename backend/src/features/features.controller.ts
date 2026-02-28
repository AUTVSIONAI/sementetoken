import { Controller, Get, Param, Patch, Body, UseGuards, Post, Delete } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  async findAll() {
    return this.featuresService.findAll();
  }

  @Get(':key')
  async isEnabled(@Param('key') key: string) {
    const enabled = await this.featuresService.isEnabled(key);
    return { key, enabled };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':key')
  async setStatus(
    @Param('key') key: string,
    @Body() body: { enabled: boolean }
  ) {
    return this.featuresService.setStatus(key, body.enabled);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('init')
  async initDefaults() {
    await this.featuresService.createDefaultFlags();
    return { message: 'Default feature flags initialized' };
  }
}
