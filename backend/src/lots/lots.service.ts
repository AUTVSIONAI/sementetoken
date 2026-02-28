import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreeLot } from './tree-lot.entity';
import { SeedTokenService } from '../seed-token/seed-token.service';
import { TreesService } from '../trees/trees.service';
import { TreeStatus } from '../trees/tree.entity';

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(TreeLot)
    private lotsRepository: Repository<TreeLot>,
    private seedTokenService: SeedTokenService,
    private treesService: TreesService
  ) {}

  findAll() {
    return this.lotsRepository.find({ relations: ['brigade'] });
  }

  create(data: Partial<TreeLot>) {
    const lot = this.lotsRepository.create(data);
    return this.lotsRepository.save(lot);
  }

  async update(id: string, data: Partial<TreeLot>) {
    await this.lotsRepository.update(id, data);
    return this.lotsRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.lotsRepository.delete(id);
  }

  async purchase(userId: string, lotId: string, quantity: number) {
    const lot = await this.lotsRepository.findOne({ where: { id: lotId } });
    if (!lot) {
      throw new BadRequestException('Lote não encontrado');
    }

    if (lot.availableTrees < quantity) {
      throw new BadRequestException('Quantidade de árvores indisponível no lote');
    }

    // Find VALIDATED trees in this lot that are not yet MINTED
    // We assume VALIDATED means ready for minting
    // We need to access trees directly, but TreesService doesn't expose repository directly in a clean way
    // So we use TreesService.findAll or add a method.
    // For now, let's use a query builder via treesService (if exposed) or inject repository here?
    // LotsModule doesn't import TypeOrmModule.forFeature([Tree]), so we can't inject TreeRepo directly unless we add it to imports.
    // Better to add method in TreesService: findAvailableInLot(lotId, quantity)
    
    // Let's assume we added findAvailableInLot to TreesService. I'll add it in a moment.
    const trees = await this.treesService.findAvailableInLot(lotId, quantity);
    
    if (trees.length < quantity) {
      throw new BadRequestException('Não há árvores validadas suficientes neste lote para completar a compra');
    }

    const results = [];
    for (const tree of trees) {
      // Mint token for each tree
      // This updates tree status to MINTED
      const result = await this.seedTokenService.mintForTree(userId, tree.id, 1);
      results.push(result);
    }

    // Update Lot availability
    lot.availableTrees -= quantity;
    await this.lotsRepository.save(lot);

    return {
      message: 'Compra realizada com sucesso',
      quantity,
      lot: lot.name,
      transactions: results.map(r => r.txId)
    };
  }
}
