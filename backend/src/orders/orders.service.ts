import { Injectable, BadRequestException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, Repository } from "typeorm"
import { Order } from "./order.entity"
import { OrderItem } from "./order-item.entity"
import { Product } from "../products/product.entity"
import { Tree, TreeStatus } from "../trees/tree.entity"
import { Token } from "../tokens/token.entity"
import { Species } from "../species/species.entity"
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
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>,
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
      this.logger.log(`Verificando saldo para usuário ${userId}, totalAmount: ${totalAmount}`)
      const wallet = await this.walletService.getOrCreateWallet(userId)
      const currentBalance = Number(wallet.greenBalance) || 0
      this.logger.log(`Saldo atual: ${currentBalance}`)
      
      if (currentBalance < totalAmount) {
        throw new BadRequestException(
          `Saldo insuficiente de Green Tokens. Necessário: ${totalAmount}, Atual: ${currentBalance}. Por favor, adquira mais tokens na sua carteira.`
        )
      }

      // 2. Debitar saldo (Transação de gasto)
      this.logger.log(`Debitando saldo do usuário ${userId}`)
      await this.greenTokenService.addTransaction(
        userId,
        totalAmount,
        "spend",
        "purchase"
      )

      // 3. Criar Pedido
      this.logger.log(`Criando pedido...`)
      const order = this.ordersRepository.create({
        user: { id: userId } as any,
        totalAmount,
        totalCarbonCashbackKg
      })

      const savedOrder = await this.ordersRepository.save(order)
      this.logger.log(`Pedido salvo: ${savedOrder.id}`)

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
          // Tentar encontrar a espécie correspondente ao nome do produto
          // Isso garante que usaremos a imagem oficial do catálogo (Wikipedia) se disponível
          let speciesEntity: Species | null = null
          let treeImageUrl = product.imageUrl

          try {
            // Tenta encontrar por nome exato ou contido no nome do produto
            // Ex: "Muda de Ipê Amarelo" -> procura "Ipê Amarelo"
            const allSpecies = await this.speciesRepository.find()
            speciesEntity = allSpecies.find(s => 
              product.name.toLowerCase().includes(s.commonName.toLowerCase()) ||
              s.commonName.toLowerCase().includes(product.name.toLowerCase())
            )

            if (speciesEntity) {
              treeImageUrl = speciesEntity.imageUrl || treeImageUrl
            }
          } catch (err) {
            this.logger.warn(`Erro ao buscar espécie para produto ${product.name}: ${err.message}`)
          }

          // Criar Árvore
          const tree = this.treesRepository.create({
            species: speciesEntity ? speciesEntity.commonName : product.name,
            speciesType: speciesEntity ? { id: speciesEntity.id } : null,
            project: product.project ? ({ id: product.project.id } as any) : null,
            imageUrl: treeImageUrl,
            plantedAt: new Date(),
            status: TreeStatus.PENDING,
            growthStage: "seed",
            estimatedCo2Total: speciesEntity?.carbonEstimation || product.carbonCashbackKg || 0
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
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao processar pedido: ${error.message}`);
    }
  }
}

