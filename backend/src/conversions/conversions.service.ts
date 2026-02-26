import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Conversion } from "./conversion.entity"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"
import { WalletService } from "../wallet/wallet.service"
import { GreenTokenService } from "../green-token/green-token.service"
import { SeedTokenService } from "../seed-token/seed-token.service"

const GREEN_PER_SEED = 100

@Injectable()
export class ConversionsService {
  constructor(
    @InjectRepository(Conversion)
    private readonly conversionsRepository: Repository<Conversion>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    private readonly walletService: WalletService,
    private readonly greenTokenService: GreenTokenService,
    private readonly seedTokenService: SeedTokenService
  ) {}

  async convertGreenToSeed(userId: string, requestedGreen: number) {
    const greenToSpend = Math.floor(requestedGreen)
    if (greenToSpend <= 0) {
      throw new Error("Quantidade de Green Tokens inválida para conversão")
    }

    const wallet = await this.walletService.getOrCreateWallet(userId)
    if (!wallet.greenBalance || wallet.greenBalance < greenToSpend) {
      throw new Error("Saldo insuficiente de Green Tokens")
    }

    const seedGenerated = Math.floor(greenToSpend / GREEN_PER_SEED)
    if (seedGenerated <= 0) {
      throw new Error("Quantidade mínima de Green Tokens não atingida para gerar Semente Token")
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error("Usuário não encontrado para conversão")
    }

    const projectsRows = await this.treesRepository.query(
      "SELECT id FROM projects ORDER BY created_at ASC LIMIT 1"
    )
    const projectId =
      projectsRows && projectsRows.length
        ? (projectsRows[0] as { id?: string }).id ?? null
        : null

    const tree = this.treesRepository.create({
      project: projectId ? ({ id: projectId } as any) : null,
      species: "SementeToken",
      location: null,
      plantedAt: new Date(),
      estimatedCo2Total: null,
      growthStage: null,
      nftId: null
    })
    const savedTree = await this.treesRepository.save(tree)

    await this.greenTokenService.addTransaction(
      userId,
      greenToSpend,
      "spend",
      "conversion"
    )

    const mintResult = await this.seedTokenService.mintForTree(
      userId,
      savedTree.id,
      seedGenerated
    )

    const conversion = (this.conversionsRepository.create({
      user,
      greenSpent: greenToSpend,
      seedGenerated,
      tree: savedTree,
      blockchainTxId: mintResult.txId,
      status: "confirmed"
    } as any) as unknown) as Conversion

    await this.conversionsRepository.save(conversion)

    return {
      conversionId: (conversion as Conversion).id,
      greenSpent: (conversion as Conversion).greenSpent,
      seedGenerated: (conversion as Conversion).seedGenerated,
      treeId: savedTree.id,
      blockchainTxId: (conversion as Conversion).blockchainTxId,
      status: (conversion as Conversion).status
    }
  }

  async listForUser(userId: string) {
    const rows = await this.conversionsRepository.find({
      where: { user: { id: userId } },
      relations: { tree: true },
      order: { createdAt: "DESC" }
    })

    return rows.map((c) => ({
      id: c.id,
      greenSpent: c.greenSpent,
      seedGenerated: c.seedGenerated,
      treeId: c.tree ? c.tree.id : null,
      blockchainTxId: c.blockchainTxId,
      status: c.status,
      createdAt: c.createdAt
    }))
  }
}
