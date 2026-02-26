import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import { ConversionsService } from "./conversions.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("conversions")
export class ConversionsController {
  constructor(private readonly conversionsService: ConversionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      greenToSpend: number
    }
  ) {
    const userId = req.user?.userId as string
    return this.conversionsService.convertGreenToSeed(userId, body.greenToSpend)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    const userId = req.user?.userId as string
    return this.conversionsService.listForUser(userId)
  }
}

