import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Product } from "./product.entity"
import { Species } from "../species/species.entity"
import { Project } from "../projects/project.entity"

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>
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
    imageUrl?: string
    carbonCashbackKg?: number
    projectId?: string | null
  }): Promise<Product> {
    const product = this.productsRepository.create({
      name: payload.name,
      description: payload.description || null,
      price: payload.price,
      imageUrl: payload.imageUrl || null,
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

  async bulkCreateFromSpecies(payload?: {
    projectId?: string | null
    defaultPrice?: number | null
  }): Promise<{ created: number; skipped: number }> {
    const species = await this.speciesRepository.find({
      order: { createdAt: "ASC" } as any
    })

    if (!species.length) {
      return { created: 0, skipped: 0 }
    }

    const existing = await this.productsRepository.find({
      select: ["id", "name"] as any
    })

    const existingNames = new Set(
      existing.map((p) => (p.name || "").toLowerCase().trim()).filter(Boolean)
    )

    const project =
      payload?.projectId && payload.projectId.trim()
        ? await this.projectsRepository.findOne({
            where: { id: payload.projectId.trim() }
          })
        : null

    let created = 0
    let skipped = 0

    for (const s of species) {
      const name = (s.commonName || "").trim()
      if (!name) {
        skipped++
        continue
      }

      const key = name.toLowerCase()
      if (existingNames.has(key)) {
        skipped++
        continue
      }

      const price =
        typeof payload?.defaultPrice === "number" && Number.isFinite(payload.defaultPrice)
          ? payload.defaultPrice
          : typeof (s as any).salePrice === "number" && Number.isFinite((s as any).salePrice)
            ? (s as any).salePrice
            : typeof (s as any).baseCost === "number" && Number.isFinite((s as any).baseCost)
              ? (s as any).baseCost
              : 100

      const product = this.productsRepository.create({
        name,
        description: s.description || null,
        price,
        imageUrl: s.imageUrl || null,
        carbonCashbackKg: typeof s.carbonEstimation === "number" ? s.carbonEstimation : 0,
        project: project ? ({ id: project.id } as any) : null
      })

      await this.productsRepository.save(product)
      existingNames.add(key)
      created++
    }

    return { created, skipped }
  }
}
