import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { SpeciesService } from "./species.service"
import { Species } from "./species.entity"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { UserRole } from "../users/user.entity"

@Controller("species")
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Get()
  findAll(): Promise<Species[]> {
    return this.speciesService.findAll()
  }

  @Get("public")
  findFromPublic() {
    return this.speciesService.fetchFromPublicApi()
  }

  @Post()
  create(
    @Body()
    body: {
      commonName: string
      scientificName?: string
      biome?: string
      imageUrl?: string
    }
  ): Promise<Species> {
    return this.speciesService.create(body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("enrich-images")
  enrichImages() {
    return this.speciesService.enrichMissingImages()
  }
}
