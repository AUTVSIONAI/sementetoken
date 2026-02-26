import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Wallet } from "./wallet.entity"
import { WalletService } from "./wallet.service"
import { WalletController } from "./wallet.controller"
import { User } from "../users/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {}

