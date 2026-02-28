import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Order } from "./order.entity"
import { OrderItem } from "./order-item.entity"
import { Product } from "../products/product.entity"
import { Tree } from "../trees/tree.entity"
import { Token } from "../tokens/token.entity"
import { OrdersService } from "./orders.service"
import { OrdersController } from "./orders.controller"
import { GreenTokenModule } from "../green-token/green-token.module"
import { WalletModule } from "../wallet/wallet.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Tree, Token]),
    GreenTokenModule,
    WalletModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}

