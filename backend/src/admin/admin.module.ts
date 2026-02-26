import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "../users/user.entity"
import { Project } from "../projects/project.entity"
import { Order } from "../orders/order.entity"
import { Token } from "../tokens/token.entity"
import { Wallet } from "../wallet/wallet.entity"
import { GreenTransaction } from "../green-token/green-transaction.entity"
import { SeedTransaction } from "../seed-token/seed-transaction.entity"
import { BrigadeAction } from "../brigades/brigade-action.entity"
import { Brigade } from "../brigades/brigade.entity"
import { Brigadist } from "../brigades/brigadist.entity"
import { GreenTokenModule } from "../green-token/green-token.module"
import { AdminController } from "./admin.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      Order,
      Token,
      Wallet,
      GreenTransaction,
      SeedTransaction,
      BrigadeAction,
      Brigade,
      Brigadist
    ]),
    GreenTokenModule
  ],
  controllers: [AdminController]
})
export class AdminModule {}
