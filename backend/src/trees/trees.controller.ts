import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { diskStorage } from "multer"
import * as path from "path"
import * as fs from "fs"
import { TreesService } from "./trees.service"
import { Tree } from "./tree.entity"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { UserRole } from "../users/user.entity"
import { CreateTreeDto } from "./trees.dto"

@Controller("trees")
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Get()
  findAll(): Promise<Tree[]> {
    return this.treesService.findAll();
  }

  @Get("map")
  findForMap() {
    return this.treesService.findForMap()
  }

  @UseGuards(JwtAuthGuard)
  @Post("plant")
  plant(@Req() req: any, @Body() body: { projectId: string }) {
    const userId = req.user?.userId as string
    return this.treesService.plantForUser(userId, body.projectId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), "uploads", "trees")
          fs.mkdirSync(uploadDir, { recursive: true })
          cb(null, uploadDir)
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
          const ext = path.extname(file.originalname)
          cb(null, `${uniqueSuffix}${ext}`)
        }
      })
    })
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/trees/${file.filename}`
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() payload: CreateTreeDto): Promise<Tree> {
    return this.treesService.create(payload)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string): Promise<void> {
    return this.treesService.delete(id)
  }
}
