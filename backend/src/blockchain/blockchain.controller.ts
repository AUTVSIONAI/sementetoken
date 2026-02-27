import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from '../wallet/wallet.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService,
  ) {}

  @Post('mint-controlled')
  @UseGuards(JwtAuthGuard)
  async mintControlled(@Req() req, @Body() body: { amount: number; walletAddress: string }) {
    const userId = req.user.userId;
    
    if (!body.amount || body.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
    }
    if (!body.walletAddress) {
        throw new BadRequestException('Wallet address is required for minting');
    }

    // Validação interna: Verificar saldo interno (WalletService)
    const wallet = await this.walletService.getOrCreateWallet(userId);
    
    // Converter amount para número se vier string
    const amountToMint = Number(body.amount);

    if (wallet.seedBalance < amountToMint) {
      throw new BadRequestException('Saldo interno insuficiente para mint (withdraw)');
    }

    // Deduzir saldo interno (queima interna para mint externo)
    await this.walletService.adjustSeedBalance(userId, -amountToMint);

    // Mintar on-chain
    const targetAddress = body.walletAddress;

    const txHash = await this.blockchainService.mintSeme(
      targetAddress,
      amountToMint.toString(),
    );

    return { success: true, txHash, newInternalBalance: wallet.seedBalance - amountToMint };
  }
}
