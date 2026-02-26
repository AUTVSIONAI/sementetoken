import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { SemeTransaction } from "./seme-transaction.entity"
import { NftMetadata } from "./nft-metadata.entity"

@Injectable()
export class SemeService {
  constructor(
    @InjectRepository(SemeTransaction)
    private readonly semeTransactionsRepository: Repository<SemeTransaction>,
    @InjectRepository(NftMetadata)
    private readonly nftMetadataRepository: Repository<NftMetadata>
  ) {}

  async recordFromEvent(params: {
    walletAddress: string
    amountSeme: string
    treesEquivalent: number
    txHash: string
    blockNumber: number
  }) {
    const tx = this.semeTransactionsRepository.create({
      walletAddress: params.walletAddress,
      amountSeme: params.amountSeme,
      treesEquivalent: params.treesEquivalent,
      txHash: params.txHash,
      blockNumber: params.blockNumber,
      status: "confirmed"
    })

    return this.semeTransactionsRepository.save(tx)
  }

  async recordNftMint(tokenId: string, ownerAddress: string, blockNumber: number) {
    // Simula seleção de espécie (em produção viria de lógica de estoque ou oracle)
    const speciesList = [
      {
        name: "Ipê Amarelo",
        biome: "Cerrado",
        co2: 150,
        image: "ipfs://QmIpeAmarelo"
      },
      {
        name: "Castanheira",
        biome: "Amazônia",
        co2: 300,
        image: "ipfs://QmCastanheira"
      },
      {
        name: "Pau-Brasil",
        biome: "Mata Atlântica",
        co2: 200,
        image: "ipfs://QmPauBrasil"
      }
    ]
    const randomSpecies =
      speciesList[Math.floor(Math.random() * speciesList.length)]

    const nft = this.nftMetadataRepository.create({
      tokenId,
      ownerAddress,
      species: randomSpecies.name,
      biome: randomSpecies.biome,
      estimatedCo2: randomSpecies.co2,
      imageUrl: randomSpecies.image,
      blockNumber,
      plantingDate: new Date()
    })

    return this.nftMetadataRepository.save(nft)
  }

  async getNftMetadata(tokenId: string) {
    const meta = await this.nftMetadataRepository.findOne({ where: { tokenId } })
    if (!meta) return null

    // Retorna formato padrão ERC-721 Metadata JSON
    return {
      name: `Árvore Semente #${tokenId}`,
      description: "Árvore plantada via Ecossistema Semente",
      image: meta.imageUrl,
      attributes: [
        { trait_type: "Espécie", value: meta.species },
        { trait_type: "Bioma", value: meta.biome },
        {
          trait_type: "Data Plantio",
          value: meta.plantingDate?.toISOString().split("T")[0]
        },
        { trait_type: "Impacto CO2 (kg)", value: meta.estimatedCo2 }
      ]
    }
  }

  async getEsgStats() {
    const totalTreesRaw = await this.semeTransactionsRepository
      .createQueryBuilder("tx")
      .select("SUM(tx.trees_equivalent)", "sum")
      .getRawOne()

    const totalUsersRaw = await this.semeTransactionsRepository
      .createQueryBuilder("tx")
      .select("COUNT(DISTINCT tx.wallet_address)", "count")
      .getRawOne()

    const totalCo2Raw = await this.nftMetadataRepository
      .createQueryBuilder("nft")
      .select("SUM(nft.estimated_co2)", "sum")
      .getRawOne()

    return {
      totalTrees: parseInt(totalTreesRaw?.sum || "0"),
      totalUsers: parseInt(totalUsersRaw?.count || "0"),
      totalCo2: parseFloat(totalCo2Raw?.sum || "0")
    }
  }

  async listForWallet(walletAddress: string) {
    const rows = await this.semeTransactionsRepository.find({
      where: { walletAddress },
      order: { createdAt: "DESC" }
    })

    return rows.map((tx) => ({
      id: tx.id,
      walletAddress: tx.walletAddress,
      amountSeme: tx.amountSeme,
      treesEquivalent: tx.treesEquivalent,
      txHash: tx.txHash,
      status: tx.status,
      createdAt: tx.createdAt
    }))
  }
}
