import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Brigade } from "./brigade.entity"
import { Brigadist } from "./brigadist.entity"
import { BrigadeAction } from "./brigade-action.entity"
import { BrigadeTask } from "./brigade-task.entity"
import { User, UserRole } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"
import { GreenTokenService } from "../green-token/green-token.service"

type BrigadeSummary = {
  brigade: {
    id: string
    name: string
    city: string | null
    state: string | null
    country: string | null
  }
  stats: {
    totalTrees: number
    plantings: number
    inspections: number
    fireAlerts: number
    actionsCount: number
  }
  brigadists: {
    id: string
    name: string
    role: string | null
    email: string | null
  }[]
}

@Injectable()
export class BrigadesService {
  constructor(
    @InjectRepository(Brigade)
    private readonly brigadesRepository: Repository<Brigade>,
    @InjectRepository(Brigadist)
    private readonly brigadistsRepository: Repository<Brigadist>,
    @InjectRepository(BrigadeAction)
    private readonly actionsRepository: Repository<BrigadeAction>,
    @InjectRepository(BrigadeTask)
    private readonly tasksRepository: Repository<BrigadeTask>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    private readonly greenTokenService: GreenTokenService
  ) {}

  private async getOrCreateBrigadeForUser(userId: string): Promise<Brigade> {
    let brigade = await this.brigadesRepository.findOne({
      where: { ownerUser: { id: userId } },
      relations: { ownerUser: true }
    })

    if (!brigade) {
      const owner = await this.usersRepository.findOne({
        where: { id: userId }
      })
      if (!owner) {
        throw new Error("Usuário não encontrado para brigada")
      }
      brigade = this.brigadesRepository.create({
        name: `Brigada ${owner.name}`,
        ownerUser: owner
      })
      brigade = await this.brigadesRepository.save(brigade)
    }

    return brigade
  }

  async summaryForUser(userId: string): Promise<BrigadeSummary> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)

    const brigadists = await this.brigadistsRepository.find({
      where: { brigade: { id: brigade.id } }
    })

    const actionsRows = await this.actionsRepository
      .createQueryBuilder("a")
      .select("a.type", "type")
      .addSelect("COUNT(a.id)", "count")
      .where("a.brigade_id = :brigadeId", { brigadeId: brigade.id })
      .groupBy("a.type")
      .getRawMany<{ type: string; count: string }>()

    let plantings = 0
    let inspections = 0
    let fireAlerts = 0

    actionsRows.forEach((row) => {
      const count = parseInt(row.count, 10) || 0
      if (row.type === "planting") {
        plantings += count
      } else if (row.type === "inspection") {
        inspections += count
      } else if (row.type === "fire_alert") {
        fireAlerts += count
      }
    })

    const actionsCount = plantings + inspections + fireAlerts

    const treesRow = await this.treesRepository.query(
      `SELECT 
        COALESCE(COUNT(t.id), 0) as total_trees
      FROM trees t
      JOIN tokens tk ON tk.tree_id = t.id
      WHERE tk.user_id = $1`,
      [userId]
    )

    const treesCountRow =
      treesRow && treesRow.length
        ? (treesRow[0] as { total_trees?: string })
        : { total_trees: "0" }

    const totalTrees = treesCountRow.total_trees
      ? parseInt(treesCountRow.total_trees, 10) || 0
      : 0

    return {
      brigade: {
        id: brigade.id,
        name: brigade.name,
        city: brigade.city ?? null,
        state: brigade.state ?? null,
        country: brigade.country ?? null
      },
      stats: {
        totalTrees,
        plantings,
        inspections,
        fireAlerts,
        actionsCount
      },
      brigadists: brigadists.map((b) => ({
        id: b.id,
        name: b.name,
        role: b.role ?? null,
        email: b.email ?? null
      }))
    }
  }

  async updateBrigadeForUser(
    userId: string,
    payload: {
      name?: string
      description?: string
      city?: string
      state?: string
      country?: string
    }
  ): Promise<Brigade> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)
    if (typeof payload.name === "string" && payload.name.trim()) {
      brigade.name = payload.name.trim()
    }
    if (typeof payload.description === "string") {
      brigade.description = payload.description.trim()
    }
    if (typeof payload.city === "string") {
      brigade.city = payload.city.trim() || null
    }
    if (typeof payload.state === "string") {
      brigade.state = payload.state.trim() || null
    }
    if (typeof payload.country === "string") {
      brigade.country = payload.country.trim() || null
    }
    return this.brigadesRepository.save(brigade)
  }

  private async ensureUserHasTrees(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (user && user.role === UserRole.ADMIN) {
      return
    }
    const rows = await this.treesRepository.query(
      `SELECT 
        COALESCE(COUNT(t.id), 0) as total_trees
      FROM trees t
      JOIN tokens tk ON tk.tree_id = t.id
      WHERE tk.user_id = $1`,
      [userId]
    )

    const row =
      rows && rows.length ? (rows[0] as { total_trees?: string }) : null
    const total =
      row && row.total_trees ? parseInt(row.total_trees, 10) || 0 : 0

    if (total <= 0) {
      throw new Error(
        "Você precisa ter pelo menos uma árvore na plataforma para registrar ações de brigada."
      )
    }
  }

  async addBrigadistForUser(
    userId: string,
    payload: {
      name: string
      role?: string
      email?: string
      phone?: string
    }
  ): Promise<Brigadist> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)
    const brigadist = this.brigadistsRepository.create({
      brigade,
      name: payload.name,
      role: payload.role ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null
    })
    return this.brigadistsRepository.save(brigadist)
  }

  async listTasksForBrigadist(
    userId: string,
    brigadistId: string
  ): Promise<
    {
      id: string
      title: string
      description: string | null
      status: string
      dueDate: string | null
      createdAt: string
    }[]
  > {
    const brigade = await this.getOrCreateBrigadeForUser(userId)
    const brigadist = await this.brigadistsRepository.findOne({
      where: { id: brigadistId, brigade: { id: brigade.id } }
    })
    if (!brigadist) {
      return []
    }
    const rows = await this.tasksRepository.find({
      where: { brigadist: { id: brigadist.id } },
      order: { createdAt: "DESC" }
    })
    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString()
    }))
  }

  async createTaskForBrigadist(
    userId: string,
    brigadistId: string,
    payload: {
      title: string
      description?: string
      dueDate?: string
    }
  ): Promise<BrigadeTask | null> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)
    const brigadist = await this.brigadistsRepository.findOne({
      where: { id: brigadistId, brigade: { id: brigade.id } }
    })
    if (!brigadist) {
      return null
    }
    const task = this.tasksRepository.create({
      brigade,
      brigadist,
      title: payload.title,
      description: payload.description ?? null,
      status: "pending",
      dueDate:
        payload.dueDate && payload.dueDate.trim()
          ? new Date(payload.dueDate)
          : null
    })
    return this.tasksRepository.save(task)
  }

  async updateTaskStatusForUser(
    userId: string,
    taskId: string,
    status: string
  ): Promise<BrigadeTask | null> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, brigade: { id: brigade.id } },
      relations: { brigade: true, brigadist: true }
    })
    if (!task) {
      return null
    }
    const previousStatus = task.status
    const allowed = ["pending", "in_progress", "done"]
    const normalized =
      typeof status === "string" && allowed.includes(status)
        ? status
        : task.status
    task.status = normalized
    const saved = await this.tasksRepository.save(task)

    if (previousStatus !== "done" && normalized === "done") {
      const title = (task.title || "").toLowerCase()
      const isPatrolFromFire =
        title.startsWith("patrulhar área do alerta de fogo") ||
        title.startsWith("patrulhar a área do alerta de fogo")

      if (isPatrolFromFire) {
        const ownerRole =
          brigade.ownerUser && brigade.ownerUser.role
            ? brigade.ownerUser.role
            : UserRole.USER

        const baseDescription =
          task.description && task.description.trim()
            ? task.description.trim()
            : ""
        const story =
          `Patrulha de foco de incêndio concluída pela brigada ${brigade.name}` +
          (task.brigadist && task.brigadist.name
            ? ` com apoio do brigadista ${task.brigadist.name}`
            : "") +
          `. Tarefa original: "${task.title}".`

        const feedDescription = baseDescription
          ? `${baseDescription} ${story}`
          : story

        const inspection = this.actionsRepository.create({
          brigade,
          brigadist: task.brigadist ?? null,
          tree: null,
          project: null,
          type: "inspection",
          description: feedDescription,
          status: ownerRole === UserRole.CORPORATE ? "approved" : "pending",
          mediaUrl: null,
          mediaType: null,
          mediaDurationSeconds: null,
          location: null
        })

        await this.actionsRepository.save(inspection)
      }
    }

    return saved
  }

  async addActionForUser(
    userId: string,
    payload: {
      type: "planting" | "inspection" | "fire_alert"
      treeId?: string
      projectId?: string
      description?: string
      latitude?: number
      longitude?: number
      brigadistId?: string
      mediaUrl?: string
      mediaType?: "image" | "video"
      mediaDurationSeconds?: number
    }
  ): Promise<BrigadeAction> {
    const brigade = await this.getOrCreateBrigadeForUser(userId)

    await this.ensureUserHasTrees(userId)

    const ownerRole =
      brigade.ownerUser && brigade.ownerUser.role
        ? brigade.ownerUser.role
        : UserRole.USER

    let brigadist: Brigadist | null = null
    if (payload.brigadistId) {
      brigadist = await this.brigadistsRepository.findOne({
        where: { id: payload.brigadistId, brigade: { id: brigade.id } }
      })
    }

    const action = this.actionsRepository.create({
      brigade,
      brigadist: brigadist ?? null,
      tree: payload.treeId ? ({ id: payload.treeId } as Tree) : null,
      project: payload.projectId ? ({ id: payload.projectId } as any) : null,
      type: payload.type,
      description: payload.description ?? null,
      status: ownerRole === UserRole.CORPORATE ? "approved" : "pending",
      mediaUrl: payload.mediaUrl ?? null,
      mediaType: payload.mediaType ?? null,
      mediaDurationSeconds:
        typeof payload.mediaDurationSeconds === "number"
          ? payload.mediaDurationSeconds
          : null,
      location:
        typeof payload.latitude === "number" &&
        typeof payload.longitude === "number"
          ? () =>
              `ST_SetSRID(ST_MakePoint(${payload.longitude}, ${payload.latitude}), 4326)`
          : null
    })

    const saved = await this.actionsRepository.save(action)

    let reward = 0
    if (payload.type === "planting") {
      reward = 10
    } else if (payload.type === "inspection") {
      reward = 3
    } else if (payload.type === "fire_alert") {
      reward = 5
    }

    if (reward > 0) {
      await this.greenTokenService.addTransaction(
        userId,
        reward,
        "earn",
        "brigade"
      )
    }

    return saved
  }

  async fireAlertsForUser(userId: string): Promise<
    {
      id: string
      latitude: number
      longitude: number
      description: string | null
      createdAt: string
      projectId: string | null
    }[]
  > {
    const brigade = await this.getOrCreateBrigadeForUser(userId)

    const rows = await this.actionsRepository.query(
      `SELECT 
        id,
        project_id,
        description,
        created_at,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM brigade_actions
      WHERE brigade_id = $1
        AND type = 'fire_alert'
        AND location IS NOT NULL
      ORDER BY created_at DESC`,
      [brigade.id]
    )

    return rows.map((row: any) => ({
      id: row.id,
      latitude: typeof row.latitude === "number" ? row.latitude : 0,
      longitude: typeof row.longitude === "number" ? row.longitude : 0,
      description: row.description ?? null,
      createdAt: row.created_at,
      projectId: row.project_id ?? null
    }))
  }

  async actionsTimelineForUser(userId: string): Promise<
    {
      id: string
      type: string
      description: string | null
      createdAt: string
      brigadistName: string | null
    }[]
  > {
    const brigade = await this.getOrCreateBrigadeForUser(userId)

    const rows = await this.actionsRepository.query(
      `SELECT 
        a.id,
        a.type,
        a.description,
        a.created_at,
        b.name as brigadist_name
      FROM brigade_actions a
      LEFT JOIN brigadists b ON b.id = a.brigadist_id
      WHERE a.brigade_id = $1
      ORDER BY a.created_at DESC
      LIMIT 20`,
      [brigade.id]
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description ?? null,
      createdAt: row.created_at,
      brigadistName: row.brigadist_name ?? null
    }))
  }

  async publicFeed(projectId?: string | null): Promise<
    {
      id: string
      type: string
      description: string | null
      createdAt: string
      brigadistName: string | null
      brigadeName: string | null
      latitude: number | null
      longitude: number | null
      ownerRole: string | null
      treeSpecies: string | null
      projectId: string | null
      mediaUrl: string | null
      mediaType: string | null
      mediaDurationSeconds: number | null
    }[]
  > {
    try {
      const rows = await (projectId
        ? this.actionsRepository.query(
            `SELECT 
              a.id,
              a.type,
              a.description,
              a.created_at,
              b.name as brigadist_name,
              br.name as brigade_name,
              u.role as owner_role,
              t.species as tree_species,
              ST_Y(a.location::geometry) as latitude,
              ST_X(a.location::geometry) as longitude,
              a.project_id as project_id,
              a.media_url as media_url,
              a.media_type as media_type,
              a.media_duration_seconds as media_duration_seconds
            FROM brigade_actions a
            LEFT JOIN brigadists b ON b.id = a.brigadist_id
            LEFT JOIN brigades br ON br.id = a.brigade_id
            LEFT JOIN users u ON u.id = br.owner_user_id
            LEFT JOIN trees t ON t.id = a.tree_id
            WHERE a.type IN ('planting', 'inspection', 'fire_alert')
              AND a.status = 'approved'
              AND a.project_id = $1
            ORDER BY a.created_at DESC
            LIMIT 50`,
            [projectId]
          )
        : this.actionsRepository.query(
            `SELECT 
              a.id,
              a.type,
              a.description,
              a.created_at,
              b.name as brigadist_name,
              br.name as brigade_name,
              u.role as owner_role,
              t.species as tree_species,
              ST_Y(a.location::geometry) as latitude,
              ST_X(a.location::geometry) as longitude,
              a.project_id as project_id,
              a.media_url as media_url,
              a.media_type as media_type,
              a.media_duration_seconds as media_duration_seconds
            FROM brigade_actions a
            LEFT JOIN brigadists b ON b.id = a.brigadist_id
            LEFT JOIN brigades br ON br.id = a.brigade_id
            LEFT JOIN users u ON u.id = br.owner_user_id
            LEFT JOIN trees t ON t.id = a.tree_id
            WHERE a.type IN ('planting', 'inspection', 'fire_alert')
              AND a.status = 'approved'
            ORDER BY a.created_at DESC
            LIMIT 50`
          ))

      return rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        description: row.description ?? null,
        createdAt: row.created_at,
        brigadistName: row.brigadist_name ?? null,
        brigadeName: row.brigade_name ?? null,
        ownerRole: row.owner_role ?? null,
        treeSpecies: row.tree_species ?? null,
        latitude:
          typeof row.latitude === "number" || typeof row.latitude === "string"
            ? Number(row.latitude)
            : null,
        longitude:
          typeof row.longitude === "number" || typeof row.longitude === "string"
            ? Number(row.longitude)
            : null,
        projectId: row.project_id ?? null,
        mediaUrl: row.media_url ?? null,
        mediaType: row.media_type ?? null,
        mediaDurationSeconds:
          typeof row.media_duration_seconds === "number"
            ? row.media_duration_seconds
            : null
      }))
    } catch {
      return []
    }
  }
}
