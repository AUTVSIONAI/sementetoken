import { Controller, Get, Query, Param } from "@nestjs/common"
import { SemeService } from "./seme.service"

@Controller("seme")
export class SemeController {
  constructor(private readonly semeService: SemeService) {}

  @Get("transactions")
  async listTransactions(@Query("walletAddress") walletAddress: string) {
    if (!walletAddress) {
      return []
    }

    return this.semeService.listForWallet(walletAddress)
  }

  @Get("nft/:tokenId")
  async getNftMetadata(@Param("tokenId") tokenId: string) {
    return this.semeService.getNftMetadata(tokenId)
  }

  @Get("esg/stats")
  async getEsgStats() {
    return this.semeService.getEsgStats()
  }
}
