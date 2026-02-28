import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { SeedTransaction } from "./seed-transaction.entity"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { Tree, TreeStatus } from "../trees/tree.entity"
import { WalletService } from "../wallet/wallet.service"
import { PolygonService } from "./polygon.service"

@Injectable()
export class SeedTokenService {
  constructor(
    @InjectRepository(SeedTransaction)
    private readonly seedTransactionsRepository: Repository<SeedTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    private readonly walletService: WalletService,
    private readonly polygonService: PolygonService
  ) {}

  async mintForTree(userId: string, treeId: string, amount: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error("Usuário não encontrado para Semente Token")
    }

    const tree = await this.treesRepository.findOne({ where: { id: treeId } })
    if (!tree) {
      throw new Error("Árvore não encontrada para Semente Token")
    }

    if (tree.status !== TreeStatus.VALIDATED) {
      throw new Error("A árvore precisa estar validada (status=validated) para gerar o NFT.")
    }

    const address = user.email
    const mintResult = await this.polygonService.mintTreeToken({
      userAddress: address,
      treeId: tree.id
    })

    await this.walletService.adjustSeedBalance(userId, amount)

    const tx = this.seedTransactionsRepository.create({
      user,
      amount,
      txId: mintResult.txId,
      status: "confirmed"
    } as any)

    await this.seedTransactionsRepository.save(tx)

    tree.nftId = mintResult.txId
    tree.status = TreeStatus.MINTED
    tree.txHash = mintResult.txId
    await this.treesRepository.save(tree)

    return mintResult
  }
}

