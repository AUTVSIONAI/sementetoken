import { Controller, Get, Param, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { EsgService } from './esg.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('esg')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EsgController {
  constructor(private readonly esgService: EsgService) {}

  @Get('trees/municipalities')
  @Roles(UserRole.ADMIN)
  async getMunicipalities() {
    return this.esgService.getAllMunicipalities();
  }

  @Get('trees/municipality/:ibge')
  @Roles(UserRole.ADMIN)
  async getMunicipality(@Param('ibge') ibge: string) {
    const data = await this.esgService.getMunicipalityData(ibge);
    if (!data) {
      throw new NotFoundException('Municipality not found');
    }
    return data;
  }

  @Get('trees/state/:uf')
  @Roles(UserRole.ADMIN)
  async getState(@Param('uf') uf: string) {
    return this.esgService.getStateData(uf);
  }

  @Get('report/:companyId')
  @Roles(UserRole.ADMIN, UserRole.USER) // Allow user to get their own report or admin to get any
  async getReport(@Param('companyId') companyId: string, @Res() res: Response) {
    const pdfBuffer = await this.esgService.generateReport(companyId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=esg-report-${companyId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
