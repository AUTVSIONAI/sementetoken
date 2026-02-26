import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Product } from "./product.entity"

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: ["project"]
    })
  }

  async create(payload: {
    name: string
    description?: string
    price: number
    carbonCashbackKg?: number
    projectId?: string | null
  }): Promise<Product> {
    const product = this.productsRepository.create({
      name: payload.name,
      description: payload.description || null,
      price: payload.price,
      carbonCashbackKg:
        typeof payload.carbonCashbackKg === "number"
          ? payload.carbonCashbackKg
          : 0,
      project: payload.projectId ? ({ id: payload.projectId } as any) : null
    })
    return this.productsRepository.save(product)
  }

  async delete(id: string): Promise<void> {
    await this.productsRepository.delete(id)
  }
}
