import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Order } from "./order.entity"
import { OrderItem } from "./order-item.entity"
import { Product } from "../products/product.entity"

type CreateOrderItemInput = {
  productId: string
  quantity: number
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>
  ) {}

  async createForUser(
    userId: string,
    items: CreateOrderItemInput[]
  ): Promise<{
    orderId: string
    totalAmount: number
    totalCarbonCashbackKg: number
    createdAt: string
    generatedTokens: number
  }> {
    if (!items || !items.length) {
      throw new Error("Nenhum item informado")
    }

    const productIds = items.map((i) => i.productId)
    const products = await this.productsRepository.findByIds(productIds)

    if (!products.length) {
      throw new Error("Produtos não encontrados")
    }

    let totalAmount = 0
    let totalCarbonCashbackKg = 0

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        continue
      }
      const qty = item.quantity > 0 ? item.quantity : 1
      totalAmount += product.price * qty
      totalCarbonCashbackKg += (product.carbonCashbackKg || 0) * qty
    }

    const order = this.ordersRepository.create({
      user: { id: userId } as any,
      totalAmount,
      totalCarbonCashbackKg
    })

    const savedOrder = await this.ordersRepository.save(order)

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        continue
      }
      const qty = item.quantity > 0 ? item.quantity : 1

      const orderItem = this.orderItemsRepository.create({
        order: savedOrder,
        product,
        quantity: qty,
        unitPrice: product.price,
        carbonCashbackKg: (product.carbonCashbackKg || 0) * qty
      })
      await this.orderItemsRepository.save(orderItem)
    }

    try {
      // Inserção direta de tokens para cashback
      // Nota: tree_id é NULL pois é um token gerado por compra, não plantio direto
      const tokensResult = await this.ordersRepository.query(
        "INSERT INTO tokens (user_id, tree_id, amount) VALUES ($1, NULL, $2) RETURNING id",
        [userId, totalCarbonCashbackKg]
      )

      const generatedTokens = tokensResult?.length || 0

      return {
        orderId: savedOrder.id,
        totalAmount,
        totalCarbonCashbackKg,
        createdAt: savedOrder.createdAt.toISOString(),
        generatedTokens
      }
    } catch (error) {
      console.error("Erro ao gerar tokens de cashback:", error)
      // Não falhar o pedido se o token falhar, mas logar erro
      return {
        orderId: savedOrder.id,
        totalAmount,
        totalCarbonCashbackKg,
        createdAt: savedOrder.createdAt.toISOString(),
        generatedTokens: 0
      }
    }
  }
}

