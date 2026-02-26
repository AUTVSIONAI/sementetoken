import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Conversion } from "./conversion.entity"
import { ConversionsService } from "./conversions.service"
import { ConversionsController } from "./conversions.controller"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"
import { WalletModule } from "../wallet/wallet.module"
import { GreenTokenModule } from "../green-token/green-token.module"
import { SeedTokenModule } from "../seed-token/seed-token.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversion, Wallet, User, Tree]),
    WalletModule,
    GreenTokenModule,
    SeedTokenModule
  ],
  controllers: [ConversionsController],
  providers: [ConversionsService]
})
export class ConversionsModule {}

