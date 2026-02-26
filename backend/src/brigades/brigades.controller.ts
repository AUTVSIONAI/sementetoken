import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { diskStorage } from "multer"
import * as path from "path"
import * as fs from "fs"
import { BrigadesService } from "./brigades.service"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"

@Controller("brigades")
export class BrigadesController {
  constructor(private readonly brigadesService: BrigadesService) {}

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  summary(@Req() req: any) {
    const userId = req.user?.userId as string
    return this.brigadesService.summaryForUser(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateBrigade(
    @Req() req: any,
    @Body()
    body: {
      name?: string
      description?: string
      city?: string
      state?: string
      country?: string
    }
  ) {
    const userId = req.user?.userId as string
    return this.brigadesService.updateBrigadeForUser(userId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Post("brigadists")
  addBrigadist(
    @Req() req: any,
    @Body()
    body: {
      name: string
      role?: string
      email?: string
      phone?: string
    }
  ) {
    const userId = req.user?.userId as string
    return this.brigadesService.addBrigadistForUser(userId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Post("actions")
  addAction(
    @Req() req: any,
    @Body()
    body: {
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
  ) {
    const userId = req.user?.userId as string
    return this.brigadesService.addActionForUser(userId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Post("media")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            "brigade-actions"
          )
          fs.mkdirSync(uploadDir, { recursive: true })
          cb(null, uploadDir)
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname)
          const base = Date.now().toString(36)
          const random = Math.round(Math.random() * 1e9).toString(36)
          cb(null, `${base}-${random}${ext}`)
        }
      }),
      limits: {
        fileSize: 50 * 1024 * 1024
      },
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.startsWith("image/") &&
          !file.mimetype.startsWith("video/")
        ) {
          return cb(
            new BadRequestException(
              "Tipo de arquivo não suportado. Envie imagem ou vídeo."
            ),
            false
          )
        }
        cb(null, true)
      }
    })
  )
  uploadMedia(
    @UploadedFile() file: any,
    @Body()
    body: {
      durationSeconds?: string
    }
  ) {
    if (!file) {
      throw new BadRequestException("Arquivo de mídia é obrigatório.")
    }

    const relativeBase = "/uploads/brigade-actions"
    const mediaPath = `${relativeBase}/${file.filename}`.replace(/\\/g, "/")

    const mediaType = file.mimetype.startsWith("video/") ? "video" : "image"

    let mediaDurationSeconds: number | null = null
    if (body && typeof body.durationSeconds === "string") {
      const parsed = Number(body.durationSeconds)
      mediaDurationSeconds =
        Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
    }

    return {
      mediaUrl: mediaPath,
      mediaType,
      mediaDurationSeconds: mediaType === "video" ? mediaDurationSeconds : null
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("fire-alerts")
  fireAlerts(@Req() req: any) {
    const userId = req.user?.userId as string
    return this.brigadesService.fireAlertsForUser(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get("actions")
  actions(@Req() req: any) {
    const userId = req.user?.userId as string
    return this.brigadesService.actionsTimelineForUser(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get("brigadists/:id/tasks")
  brigadistTasks(@Req() req: any) {
    const userId = req.user?.userId as string
    const brigadistId = req.params?.id as string
    return this.brigadesService.listTasksForBrigadist(userId, brigadistId)
  }

  @UseGuards(JwtAuthGuard)
  @Post("brigadists/:id/tasks")
  createBrigadistTask(
    @Req() req: any,
    @Body()
    body: {
      title: string
      description?: string
      dueDate?: string
    }
  ) {
    const userId = req.user?.userId as string
    const brigadistId = req.params?.id as string
    return this.brigadesService.createTaskForBrigadist(userId, brigadistId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Patch("tasks/:id/status")
  updateTaskStatus(
    @Req() req: any,
    @Body()
    body: {
      status: string
    }
  ) {
    const userId = req.user?.userId as string
    const taskId = req.params?.id as string
    return this.brigadesService.updateTaskStatusForUser(
      userId,
      taskId,
      body.status
    )
  }

  @Get("feed")
  feed(@Query("projectId") projectId?: string) {
    return this.brigadesService.publicFeed(projectId)
  }
}
