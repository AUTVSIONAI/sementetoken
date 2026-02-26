import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { DashboardService } from "./dashboard.service"

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  summary(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId
    return userId
      ? this.dashboardService.userSummary(userId)
      : this.dashboardService.getSummary()
  }

  @UseGuards(JwtAuthGuard)
  @Get("trees")
  userTrees(@Req() req: any) {
    return this.dashboardService.userTrees(req.user.sub)
  }

  @UseGuards(JwtAuthGuard)
  @Get("benefits")
  userBenefits(@Req() req: any) {
    const userId = req.user?.sub || req.user?.userId
    return this.dashboardService.userBenefits(userId)
  }
}
