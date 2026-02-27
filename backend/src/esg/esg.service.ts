import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tree } from '../trees/tree.entity';

@Injectable()
export class EsgService {
  constructor(
    @InjectRepository(Tree)
    private treesRepository: Repository<Tree>,
  ) {}

  async getDashboardStats() {
    const totalTrees = await this.treesRepository.count();
    // Lógica para agregar dados on-chain + off-chain
    // Em um cenário real, consultaria o BlockchainService para pegar supply total de tokens e NFTs
    return {
      totalTrees,
      co2Sequestered: totalTrees * 0.15, // Estimativa: 150kg por árvore adulta
      onChainTrees: 0, // Placeholder: implementaria consulta ao BlockchainService
      offChainTrees: totalTrees,
      lastUpdate: new Date(),
    };
  }
}
