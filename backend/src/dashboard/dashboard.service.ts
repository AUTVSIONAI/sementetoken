import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Tree } from "../trees/tree.entity"
import { SemeService } from "../seme/seme.service"

type DashboardSummary = {
  totalTrees: number
  totalCo2: number
  nfts: number
  greenCredits: number
}

type UserBenefit = {
  id: string
  title: string
  description: string
  minCredits: number
  discountPercent: number
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    private readonly semeService: SemeService
  ) {}

  private getBaseBenefits(): UserBenefit[] {
    return [
      {
        id: "market-basic",
        title: "Desconto verde na loja",
        description: "Use seus créditos para obter desconto em produtos dos parceiros.",
        minCredits: 10,
        discountPercent: 5
      },
      {
        id: "market-premium",
        title: "Benefício agrofloresta",
        description: "Maior desconto em itens ligados a agroflorestas e agricultura familiar.",
        minCredits: 30,
        discountPercent: 10
      },
      {
        id: "utilities-partner",
        title: "Parcerias utilidades",
        description: "Prepare-se para conectar seus créditos a contas de luz, água e mercado.",
        minCredits: 50,
        discountPercent: 15
      }
    ]
  }

  async getSummary(): Promise<DashboardSummary> {
    // Busca dados on-chain/blockchain via SemeService
    const esgStats = await this.semeService.getEsgStats()

    // Mantém compatibilidade com dados locais legados se necessário
    const localTotalTrees = await this.treesRepository.count()
    
    // Prioriza dados da blockchain se existirem, senão soma ou usa local
    // Assumindo que o objetivo é mostrar o total global da plataforma (V3 + Legado ou apenas V3)
    // Vamos somar para ter um "Total Geral" se os sistemas forem híbridos,
    // mas se V3 substitui V2, talvez devêssemos mostrar apenas V3.
    // Como não tenho certeza da migração de dados, vou somar por segurança,
    // mas o ideal seria migrar os dados antigos para a blockchain.
    
    const totalTrees = esgStats.totalTrees + localTotalTrees
    const totalCo2 = esgStats.totalCo2 // CO2 local era calculado via query complexa, vamos simplificar usando o do ESG se disponível
    
    // Se não tiver dados on-chain de CO2, tenta o fallback local
    let finalCo2 = totalCo2
    if (finalCo2 === 0) {
       const co2Result = await this.treesRepository
        .createQueryBuilder("tree")
        .select("SUM(tree.estimatedCo2Total)", "total")
        .getRawOne<{ total: string | null }>()
       finalCo2 = co2Result?.total ? parseFloat(co2Result.total) : 0
    }

    const greenCredits = Math.floor(finalCo2 / 10)

    return {
      totalTrees,
      totalCo2: finalCo2,
      nfts: esgStats.totalTrees, // Assumindo 1 árvore = 1 NFT no novo modelo
      greenCredits
    }
  }

  async userSummary(userId: string): Promise<DashboardSummary> {
    const rows = await this.treesRepository.query(
      `SELECT 
        COUNT(tk.id) as total_trees,
        COALESCE(SUM(tr.estimated_co2_total), 0) as total_co2
      FROM tokens tk
      JOIN trees tr ON tr.id = tk.tree_id
      WHERE tk.user_id = $1`,
      [userId]
    )

    const row =
      rows && rows.length
        ? (rows[0] as { total_trees?: string; total_co2?: string })
        : { total_trees: "0", total_co2: "0" }

    const cashbackRows = await this.treesRepository.query(
      `SELECT COALESCE(SUM(amount), 0) as total_cashback 
       FROM tokens 
       WHERE user_id = $1 AND tree_id IS NULL`,
      [userId]
    )

    const cashbackRow =
      cashbackRows && cashbackRows.length
        ? (cashbackRows[0] as { total_cashback?: string })
        : { total_cashback: "0" }

    const totalTrees = row.total_trees ? parseInt(row.total_trees, 10) || 0 : 0
    const co2FromTrees = row.total_co2 ? parseFloat(row.total_co2) || 0 : 0
    const cashbackCo2 = cashbackRow.total_cashback
      ? parseFloat(cashbackRow.total_cashback) || 0
      : 0
    const totalCo2 = co2FromTrees + cashbackCo2
    const greenCredits = Math.floor(totalCo2 / 10)

    return {
      totalTrees,
      totalCo2,
      nfts: totalTrees,
      greenCredits
    }
  }

  async userBenefits(userId: string): Promise<{
    greenCredits: number
    benefits: UserBenefit[]
  }> {
    const summary = await this.userSummary(userId)
    const all = this.getBaseBenefits()
    const benefits = all.filter((b) => summary.greenCredits >= b.minCredits)
    return {
      greenCredits: summary.greenCredits,
      benefits
    }
  }

  async userTrees(userId: string) {
    const rows = await this.treesRepository.query(
      `SELECT 
        tr.id,
        tr.species,
        tr.growth_stage,
        tr.estimated_co2_total,
        tr.planted_at,
        p.name as project_name,
        p.city,
        p.state,
        p.country
      FROM tokens tk
      JOIN trees tr ON tr.id = tk.tree_id
      LEFT JOIN projects p ON p.id = tr.project_id
      WHERE tk.user_id = $1
      ORDER BY tr.created_at DESC`,
      [userId]
    )

    return rows.map((row: any) => ({
      id: row.id,
      species: row.species,
      growthStage: row.growth_stage,
      estimatedCo2Total: row.estimated_co2_total ?? 0,
      plantedAt: row.planted_at,
      projectName: row.project_name,
      city: row.city,
      state: row.state,
      country: row.country
    }))
  }
}
