import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Species } from "./species.entity"
import { SpeciesController } from "./species.controller"
import { SpeciesService } from "./species.service"
import { WikipediaSpeciesService } from "./wikipedia-species.service"

@Module({
  imports: [TypeOrmModule.forFeature([Species])],
  controllers: [SpeciesController],
  providers: [SpeciesService, WikipediaSpeciesService],
  exports: [SpeciesService]
})
export class SpeciesModule {}

