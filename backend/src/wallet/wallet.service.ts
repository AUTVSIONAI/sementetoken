import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Wallet } from "./wallet.entity"
import { User } from "../users/user.entity"

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true }
    })

    if (!wallet) {
      const user = await this.usersRepository.findOne({ where: { id: userId } })
      if (!user) {
        throw new Error("Usuário não encontrado para carteira")
      }
      wallet = this.walletRepository.create({
        user,
        greenBalance: 0,
        seedBalance: 0
      })
      wallet = await this.walletRepository.save(wallet)
    }

    return wallet
  }

  async adjustGreenBalance(userId: string, delta: number): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId)
    wallet.greenBalance = (wallet.greenBalance || 0) + delta
    if (wallet.greenBalance < 0) {
      throw new Error("Saldo insuficiente de Green Tokens")
    }
    return this.walletRepository.save(wallet)
  }

  async adjustSeedBalance(userId: string, delta: number): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId)
    wallet.seedBalance = (wallet.seedBalance || 0) + delta
    if (wallet.seedBalance < 0) {
      throw new Error("Saldo insuficiente de Semente Tokens")
    }
    return this.walletRepository.save(wallet)
  }
}

