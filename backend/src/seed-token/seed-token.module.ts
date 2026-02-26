import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SeedTransaction } from "./seed-transaction.entity"
import { SeedTokenService } from "./seed-token.service"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"
import { PolygonService } from "./polygon.service"
import { WalletModule } from "../wallet/wallet.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([SeedTransaction, Wallet, User, Tree]),
    WalletModule
  ],
  providers: [SeedTokenService, PolygonService],
  exports: [SeedTokenService]
})
export class SeedTokenModule {}
