import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { GreenTransaction } from "./green-transaction.entity"
import { GreenTokenService } from "./green-token.service"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { WalletModule } from "../wallet/wallet.module"

@Module({
  imports: [TypeOrmModule.forFeature([GreenTransaction, Wallet, User]), WalletModule],
  providers: [GreenTokenService],
  exports: [GreenTokenService]
})
export class GreenTokenModule {}
