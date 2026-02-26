import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards
} from "@nestjs/common"
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
