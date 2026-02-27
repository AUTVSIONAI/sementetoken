import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  async mintTreeNft(to: string, metadataUri: string): Promise<string> {
    // Integração com contrato TreeNFT (stub)
    this.logger.log(`Minting TreeNFT to ${to} with URI ${metadataUri}`);
    return `tx_nft_mint_${Date.now()}`;
  }
}
