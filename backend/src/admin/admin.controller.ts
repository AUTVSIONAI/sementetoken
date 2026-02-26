import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { User, UserRole } from "../users/user.entity"
import { Project } from "../projects/project.entity"
import { Order } from "../orders/order.entity"
import { Token } from "../tokens/token.entity"
import { Wallet } from "../wallet/wallet.entity"
import { GreenTransaction } from "../green-token/green-transaction.entity"
import { SeedTransaction } from "../seed-token/seed-transaction.entity"
import { BrigadeAction } from "../brigades/brigade-action.entity"
import { Brigade } from "../brigades/brigade.entity"
import { Brigadist } from "../brigades/brigadist.entity"
import { GreenTokenService } from "../green-token/green-token.service"

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(GreenTransaction)
    private readonly greenTransactionsRepository: Repository<GreenTransaction>,
    @InjectRepository(SeedTransaction)
    private readonly seedTransactionsRepository: Repository<SeedTransaction>,
    @InjectRepository(BrigadeAction)
    private readonly brigadeActionsRepository: Repository<BrigadeAction>,
    @InjectRepository(Brigade)
    private readonly brigadesRepository: Repository<Brigade>,
    @InjectRepository(Brigadist)
    private readonly brigadistsRepository: Repository<Brigadist>,
    private readonly greenTokenService: GreenTokenService
  ) {}

  @Get("brigades")
  async listBrigades() {
    const brigades = await this.brigadesRepository.find({
      relations: { ownerUser: true },
      order: { createdAt: "DESC" }
    })

    const actionsCountsRows = await this.brigadeActionsRepository
      .createQueryBuilder("a")
      .select("a.brigade_id", "brigadeId")
      .addSelect("COUNT(a.id)", "actionsCount")
      .groupBy("a.brigade_id")
      .getRawMany<{ brigadeId: string; actionsCount: string }>()

    const brigadistsCountsRows = await this.brigadistsRepository
      .createQueryBuilder("b")
      .select("b.brigade_id", "brigadeId")
      .addSelect("COUNT(b.id)", "brigadistsCount")
      .groupBy("b.brigade_id")
      .getRawMany<{ brigadeId: string; brigadistsCount: string }>()

    const actionsByBrigade = new Map<string, number>()
    actionsCountsRows.forEach((row) => {
      actionsByBrigade.set(
        row.brigadeId,
        row.actionsCount ? parseInt(row.actionsCount, 10) || 0 : 0
      )
    })

    const brigadistsByBrigade = new Map<string, number>()
    brigadistsCountsRows.forEach((row) => {
      brigadistsByBrigade.set(
        row.brigadeId,
        row.brigadistsCount ? parseInt(row.brigadistsCount, 10) || 0 : 0
      )
    })

    return brigades.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description ?? null,
      city: b.city ?? null,
      state: b.state ?? null,
      country: b.country ?? null,
      owner: b.ownerUser
        ? {
            id: b.ownerUser.id,
            name: b.ownerUser.name,
            email: b.ownerUser.email,
            role: b.ownerUser.role
          }
        : null,
      brigadistsCount: brigadistsByBrigade.get(b.id) || 0,
      actionsCount: actionsByBrigade.get(b.id) || 0,
      createdAt: b.createdAt
    }))
  }

  @Get("brigades/:id/brigadists")
  async listBrigadists(@Param("id") id: string) {
    const brigadists = await this.brigadistsRepository.find({
      where: { brigade: { id } },
      order: { createdAt: "DESC" }
    })

    return brigadists.map((b) => ({
      id: b.id,
      name: b.name,
      role: b.role ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      createdAt: b.createdAt
    }))
  }

  @Patch("brigades/:id")
  async updateBrigade(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string
      description?: string | null
      city?: string | null
      state?: string | null
      country?: string | null
    }
  ) {
    const brigade = await this.brigadesRepository.findOne({
      where: { id },
      relations: { ownerUser: true }
    })
    if (!brigade) {
      throw new Error("Brigada não encontrada")
    }

    if (typeof body.name === "string" && body.name.trim().length > 0) {
      brigade.name = body.name.trim()
    }
    if (typeof body.description === "string" || body.description === null) {
      brigade.description = body.description ?? null
    }
    if (typeof body.city === "string" || body.city === null) {
      brigade.city = body.city ?? null
    }
    if (typeof body.state === "string" || body.state === null) {
      brigade.state = body.state ?? null
    }
    if (typeof body.country === "string" || body.country === null) {
      brigade.country = body.country ?? null
    }

    await this.brigadesRepository.save(brigade)

    const actionsCountRow = await this.brigadeActionsRepository
      .createQueryBuilder("a")
      .select("COUNT(a.id)", "actionsCount")
      .where("a.brigade_id = :brigadeId", { brigadeId: brigade.id })
      .getRawOne<{ actionsCount?: string }>()

    const brigadistsCountRow = await this.brigadistsRepository
      .createQueryBuilder("b")
      .select("COUNT(b.id)", "brigadistsCount")
      .where("b.brigade_id = :brigadeId", { brigadeId: brigade.id })
      .getRawOne<{ brigadistsCount?: string }>()

    const actionsCount = actionsCountRow?.actionsCount
      ? parseInt(actionsCountRow.actionsCount, 10) || 0
      : 0
    const brigadistsCount = brigadistsCountRow?.brigadistsCount
      ? parseInt(brigadistsCountRow.brigadistsCount, 10) || 0
      : 0

    return {
      id: brigade.id,
      name: brigade.name,
      description: brigade.description ?? null,
      city: brigade.city ?? null,
      state: brigade.state ?? null,
      country: brigade.country ?? null,
      owner: brigade.ownerUser
        ? {
            id: brigade.ownerUser.id,
            name: brigade.ownerUser.name,
            email: brigade.ownerUser.email,
            role: brigade.ownerUser.role
          }
        : null,
      brigadistsCount,
      actionsCount,
      createdAt: brigade.createdAt
    }
  }

  @Post("brigades")
  async createBrigade(
    @Body()
    body: {
      userId: string
      name: string
      description?: string
      city?: string
      state?: string
      country?: string
    }
  ) {
    const user = await this.usersRepository.findOne({ where: { id: body.userId } })
    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const existing = await this.brigadesRepository.findOne({
      where: { ownerUser: { id: user.id } }
    })
    if (existing) {
      throw new Error("Este usuário já possui uma brigada")
    }

    const brigade = this.brigadesRepository.create({
      ownerUser: user,
      name: body.name,
      description: body.description ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? null
    })

    await this.brigadesRepository.save(brigade)

    return {
      id: brigade.id,
      name: brigade.name,
      description: brigade.description ?? null,
      city: brigade.city ?? null,
      state: brigade.state ?? null,
      country: brigade.country ?? null,
      owner: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      brigadistsCount: 0,
      actionsCount: 0,
      createdAt: brigade.createdAt
    }
  }

  @Get("users")
  async listUsers() {
    const users = await this.usersRepository.find({
      order: { createdAt: "DESC" }
    })
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }))
  }

  @Patch("users/:id/role")
  async updateUserRole(
    @Param("id") id: string,
    @Body("role") role: UserRole
  ) {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Perfil inválido")
    }

    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    user.role = role
    await this.usersRepository.save(user)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  }

  @Get("regions")
  async regions() {
    const rows = await this.projectsRepository
      .createQueryBuilder("p")
      .select("COALESCE(p.country, 'Brasil')", "country")
      .addSelect("p.state", "state")
      .addSelect("COUNT(p.id)", "projectsCount")
      .groupBy("COALESCE(p.country, 'Brasil')")
      .addGroupBy("p.state")
      .orderBy("country", "ASC")
      .addOrderBy("p.state", "ASC")
      .getRawMany<{
        country: string
        state: string | null
        projectsCount: string
      }>()

    return rows.map((row) => ({
      country: row.country,
      state: row.state,
      projectsCount: parseInt(row.projectsCount, 10) || 0
    }))
  }

  @Get("finance/summary")
  async financeSummary() {
    const ordersRows = await this.ordersRepository
      .createQueryBuilder("o")
      .select("COUNT(o.id)", "ordersCount")
      .addSelect("COALESCE(SUM(o.totalAmount), 0)", "totalRevenue")
      .addSelect(
        "COALESCE(SUM(o.totalCarbonCashbackKg), 0)",
        "totalCashbackKg"
      )
      .getRawOne<{
        ordersCount: string
        totalRevenue: string
        totalCashbackKg: string
      }>()

    const tokensRows = await this.tokensRepository
      .createQueryBuilder("t")
      .select("COALESCE(SUM(t.amount), 0)", "totalTokens")
      .getRawOne<{ totalTokens: string }>()

    const ordersCount = ordersRows?.ordersCount
      ? parseInt(ordersRows.ordersCount, 10) || 0
      : 0
    const totalRevenue = ordersRows?.totalRevenue
      ? parseFloat(ordersRows.totalRevenue) || 0
      : 0
    const totalCashbackKg = ordersRows?.totalCashbackKg
      ? parseFloat(ordersRows.totalCashbackKg) || 0
      : 0
    const totalTokens = tokensRows?.totalTokens
      ? parseFloat(tokensRows.totalTokens) || 0
      : 0

    return {
      ordersCount,
      totalRevenue,
      totalCashbackKg,
      totalTokens
    }
  }

  @Get("wallets")
  async listWallets() {
    const users = await this.usersRepository.find({
      order: { createdAt: "DESC" }
    })

    const wallets = await this.walletsRepository.find({
      relations: { user: true }
    })

    const byUserId = new Map<string, Wallet>()
    wallets.forEach((w) => {
      if (w.user && w.user.id) {
        byUserId.set(w.user.id, w)
      }
    })

    return users.map((u) => {
      const wallet = byUserId.get(u.id)
      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        greenBalance: wallet?.greenBalance ?? 0,
        seedBalance: wallet?.seedBalance ?? 0
      }
    })
  }

  @Get("wallets/:userId")
  async walletDetail(@Param("userId") userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true }
    })

    const greens = await this.greenTransactionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
      take: 50
    })

    const seeds = await this.seedTransactionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
      take: 50
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      wallet: wallet
        ? {
            greenBalance: wallet.greenBalance,
            seedBalance: wallet.seedBalance,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
          }
        : {
            greenBalance: 0,
            seedBalance: 0,
            createdAt: null,
            updatedAt: null
          },
      greenTransactions: greens.map((g) => ({
        id: g.id,
        amount: g.amount,
        type: g.type,
        source: g.source,
        createdAt: g.createdAt
      })),
      seedTransactions: seeds.map((s) => ({
        id: s.id,
        amount: s.amount,
        txId: s.txId,
        status: s.status,
        createdAt: s.createdAt
      }))
    }
  }

  @Get("brigade-actions/pending")
  async listPendingBrigadeActions() {
    const rows = await this.brigadeActionsRepository.query(
      `SELECT 
        a.id,
        a.type,
        a.description,
        a.created_at,
        a.status,
        br.name as brigade_name,
        u.name as owner_name,
        u.email as owner_email,
        u.role as owner_role,
        t.species as tree_species,
        ST_Y(a.location::geometry) as latitude,
        ST_X(a.location::geometry) as longitude
      FROM brigade_actions a
      LEFT JOIN brigades br ON br.id = a.brigade_id
      LEFT JOIN users u ON u.id = br.owner_user_id
      LEFT JOIN trees t ON t.id = a.tree_id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
      LIMIT 100`
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description ?? null,
      createdAt: row.created_at,
      status: row.status ?? "pending",
      brigadeName: row.brigade_name ?? null,
      ownerName: row.owner_name ?? null,
      ownerEmail: row.owner_email ?? null,
      ownerRole: row.owner_role ?? null,
      treeSpecies: row.tree_species ?? null,
      latitude:
        typeof row.latitude === "number" || typeof row.latitude === "string"
          ? Number(row.latitude)
          : null,
      longitude:
        typeof row.longitude === "number" || typeof row.longitude === "string"
          ? Number(row.longitude)
          : null
    }))
  }

  @Patch("brigade-actions/:id/approve")
  async approveBrigadeAction(@Param("id") id: string) {
    const action = await this.brigadeActionsRepository.findOne({
      where: { id }
    })
    if (!action) {
      throw new Error("Ação de brigada não encontrada")
    }
    action.status = "approved"
    await this.brigadeActionsRepository.save(action)
    return { id: action.id, status: action.status }
  }

  @Patch("brigade-actions/:id/reject")
  async rejectBrigadeAction(@Param("id") id: string) {
    const action = await this.brigadeActionsRepository.findOne({
      where: { id }
    })
    if (!action) {
      throw new Error("Ação de brigada não encontrada")
    }
    action.status = "rejected"
    await this.brigadeActionsRepository.save(action)
    return { id: action.id, status: action.status }
  }

  @Get("brigades/:id/actions-map")
  async brigadeActionsMap(@Param("id") id: string) {
    const rows = await this.brigadeActionsRepository.query(
      `SELECT 
        id,
        type,
        description,
        created_at,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
      FROM brigade_actions
      WHERE brigade_id = $1
        AND location IS NOT NULL
        AND type IN ('planting', 'inspection', 'fire_alert')
      ORDER BY created_at DESC
      LIMIT 200`,
      [id]
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      description: row.description ?? null,
      createdAt: row.created_at,
      latitude:
        typeof row.latitude === "number" || typeof row.latitude === "string"
          ? Number(row.latitude)
          : null,
      longitude:
        typeof row.longitude === "number" || typeof row.longitude === "string"
          ? Number(row.longitude)
          : null
    }))
  }

  @Patch("wallets/:userId/adjust-green")
  async adjustGreen(
    @Param("userId") userId: string,
    @Body()
    body: {
      amount: number
    }
  ) {
    const amount = Number(body.amount)
    if (!amount || !Number.isFinite(amount)) {
      throw new Error("Valor inválido para ajuste")
    }

    await this.greenTokenService.addTransaction(
      userId,
      Math.abs(amount),
      amount > 0 ? "adjustment" : "adjustment",
      "admin"
    )

    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true }
    })

    if (!wallet) {
      return {
        userId,
        greenBalance: 0,
        seedBalance: 0
      }
    }

    return {
      userId,
      greenBalance: wallet.greenBalance,
      seedBalance: wallet.seedBalance
    }
  }
}
