import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { GreenTransaction } from "./green-transaction.entity"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { WalletService } from "../wallet/wallet.service"

@Injectable()
export class GreenTokenService {
  constructor(
    @InjectRepository(GreenTransaction)
    private readonly greenTransactionsRepository: Repository<GreenTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly walletService: WalletService
  ) {}

  async addTransaction(
    userId: string,
    amount: number,
    type: "earn" | "spend" | "adjustment",
    source: "purchase" | "calculator" | "admin" | "conversion" | "brigade"
  ) {
    if (amount === 0) {
      return
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error("Usuário não encontrado para Green Token")
    }

    const walletDelta = type === "spend" ? -Math.abs(amount) : Math.abs(amount)
    await this.walletService.adjustGreenBalance(userId, walletDelta)

    const tx = this.greenTransactionsRepository.create({
      user,
      amount,
      type,
      source
    } as any)

    await this.greenTransactionsRepository.save(tx)
  }
}
