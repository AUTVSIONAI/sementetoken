import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Order } from "./order.entity"
import { OrderItem } from "./order-item.entity"
import { Product } from "../products/product.entity"
import { OrdersService } from "./orders.service"
import { OrdersController } from "./orders.controller"

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}

