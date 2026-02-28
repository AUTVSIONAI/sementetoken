import { Injectable, BadRequestException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"
import { Order } from "./order.entity"
import { OrderItem } from "./order-item.entity"
import { Product } from "../products/product.entity"
import { Tree, TreeStatus } from "../trees/tree.entity"
import { Token } from "../tokens/token.entity"
import { GreenTokenService } from "../green-token/green-token.service"
import { WalletService } from "../wallet/wallet.service"

type CreateOrderItemInput = {
  productId: string
  quantity: number
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly greenTokenService: GreenTokenService,
    private readonly walletService: WalletService
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
    try {
      if (!items || !items.length) {
        throw new BadRequestException("Nenhum item informado")
      }

      const productIds = items.map((i) => i.productId)
      // Usar find com relations para garantir acesso ao projeto
      const products = await this.productsRepository.find({
        where: { id: In(productIds) },
        relations: ["project"]
      })

      if (!products.length) {
        throw new BadRequestException("Produtos não encontrados")
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

      // 1. Verificar saldo de Green Tokens
      const wallet = await this.walletService.getOrCreateWallet(userId)
      if ((wallet.greenBalance || 0) < totalAmount) {
        throw new BadRequestException(
          `Saldo insuficiente de Green Tokens. Necessário: ${totalAmount}, Atual: ${wallet.greenBalance || 0}`
        )
      }

      // 2. Debitar saldo (Transação de gasto)
      await this.greenTokenService.addTransaction(
        userId,
        totalAmount,
        "spend",
        "purchase"
      )

      // 3. Criar Pedido
      const order = this.ordersRepository.create({
        user: { id: userId } as any,
        totalAmount,
        totalCarbonCashbackKg
      })

      const savedOrder = await this.ordersRepository.save(order)

      // 4. Processar Itens (Criar OrderItems e Árvores/Tokens)
      let generatedTokensCount = 0

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

        // Criar Árvores e Tokens (1 para cada unidade comprada)
        for (let i = 0; i < qty; i++) {
          // Criar Árvore
          const tree = this.treesRepository.create({
            species: product.name, // Nome do produto como espécie/tipo
            project: product.project ? ({ id: product.project.id } as any) : null,
            imageUrl: product.imageUrl,
            plantedAt: new Date(),
            status: TreeStatus.PENDING,
            growthStage: "seed",
            estimatedCo2Total: product.carbonCashbackKg || 0
          })
          const savedTree = await this.treesRepository.save(tree)

          // Criar Token (Semente Token / Propriedade)
          const token = this.tokensRepository.create({
            user: { id: userId } as any,
            tree: savedTree,
            amount: 1 // 1 Árvore = 1 Token
          })
          await this.tokensRepository.save(token)
          generatedTokensCount++
        }
      }

      return {
        orderId: savedOrder.id,
        totalAmount,
        totalCarbonCashbackKg,
        createdAt: savedOrder.createdAt.toISOString(),
        generatedTokens: generatedTokensCount
      }
    } catch (error) {
      this.logger.error(`Failed to create order for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}

