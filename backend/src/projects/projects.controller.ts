import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { ProjectsService } from "./projects.service";
import { Project } from "./project.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { UserRole } from "../users/user.entity"

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Project | null> {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() project: Project): Promise<Project> {
    return this.projectsService.create(project);
  }
}
