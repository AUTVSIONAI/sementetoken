import { Controller, Get, Post, Put, Body, UseGuards, Req, Delete, Param } from '@nestjs/common';
import { LotsService } from './lots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get()
  findAll() {
    return this.lotsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.lotsService.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.lotsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lotsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CORPORATE)
  @Post('purchase')
  async purchase(@Body() body: { lotId: string; quantity: number }, @Req() req: any) {
    const userId = req.user.userId;
    return this.lotsService.purchase(userId, body.lotId, body.quantity);
  }
}
