import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common"
import { OrdersService } from "./orders.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      items: {
        productId: string
        quantity: number
      }[]
    }
  ) {
    const userId = req.user.sub as string
    return this.ordersService.createForUser(userId, body.items || [])
  }
}

