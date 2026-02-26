import { Injectable, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Tree } from "./tree.entity"
import { CreateTreeDto } from "./trees.dto"
import { BrigadesService } from "../brigades/brigades.service"

@Injectable()
export class TreesService {
  constructor(
    @InjectRepository(Tree)
    private treesRepository: Repository<Tree>,
    private readonly brigadesService: BrigadesService
  ) {}

  findAll(): Promise<Tree[]> {
    return this.treesRepository.find()
  }

  async create(payload: CreateTreeDto): Promise<Tree> {
    const tree = this.treesRepository.create({
      species: payload.species,
      plantedAt: payload.plantedAt ? new Date(payload.plantedAt) : null,
      growthStage: payload.growthStage || null,
      estimatedCo2Total:
        typeof payload.estimatedCo2Total === "number"
          ? payload.estimatedCo2Total
          : null,
      project: payload.projectId ? { id: payload.projectId } as any : null,
      location:
        typeof payload.latitude === "number" &&
        typeof payload.longitude === "number"
          ? () => `ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326)`
          : null
    })
    return this.treesRepository.save(tree)
  }

  async plantForUser(
    userId: string,
    projectId: string
  ): Promise<{
    tokenId: string
    treeId: string
    amount: number
    createdAt: string
  }> {
    const tree = this.treesRepository.create({
      species: "Árvore nativa",
      plantedAt: new Date(),
      growthStage: "seed",
      estimatedCo2Total: 150,
      project: projectId ? ({ id: projectId } as any) : null,
      location: null
    })

    const savedTree = await this.treesRepository.save(tree)

    const result = await this.treesRepository.query(
      "INSERT INTO tokens (user_id, tree_id, amount) VALUES ($1, $2, $3) RETURNING id, tree_id, amount, created_at",
      [userId, savedTree.id, 1]
    )

    const row =
      result && result.length
        ? (result[0] as {
            id: string
            tree_id: string
            amount: number
            created_at: string
          })
        : null

    await this.brigadesService.addActionForUser(userId, {
      type: "planting",
      treeId: savedTree.id,
      projectId: projectId || undefined,
      description: "Plantio realizado pela plataforma"
    })

    return {
      tokenId: row?.id || "",
      treeId: savedTree.id,
      amount: row?.amount || 1,
      createdAt: row?.created_at || new Date().toISOString()
    }
  }

  async findForMap(): Promise<
    {
      id: string
      species: string
      estimated_co2_total: number | null
      latitude: number
      longitude: number
      project_name: string | null
    }[]
  > {
    return this.treesRepository.query(
      "SELECT t.id, t.species, t.estimated_co2_total, ST_Y(t.location::geometry) as latitude, ST_X(t.location::geometry) as longitude, p.name as project_name FROM trees t LEFT JOIN projects p ON p.id = t.project_id WHERE t.location IS NOT NULL"
    )
  }

  async delete(id: string): Promise<void> {
    const rows = await this.treesRepository.query(
      "SELECT COUNT(*)::int as count FROM tokens WHERE tree_id = $1",
      [id]
    )
    const count =
      rows && rows.length
        ? parseInt((rows[0] as { count: string }).count, 10) || 0
        : 0

    if (count > 0) {
      throw new BadRequestException(
        "Não é possível excluir uma árvore vinculada a tokens"
      )
    }

    await this.treesRepository.delete(id)
  }
}
