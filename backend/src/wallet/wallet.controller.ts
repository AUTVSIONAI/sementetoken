import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import { WalletService } from "./wallet.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const userId = req.user?.userId as string
    const wallet = await this.walletService.getOrCreateWallet(userId)
    return {
      greenBalance: wallet.greenBalance,
      seedBalance: wallet.seedBalance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    }
  }
}

