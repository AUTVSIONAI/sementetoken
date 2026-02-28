import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Tree } from "./tree.entity"
import { TreesController } from "./trees.controller"
import { TreesService } from "./trees.service"
import { BrigadesModule } from "../brigades/brigades.module"

@Module({
  imports: [TypeOrmModule.forFeature([Tree]), BrigadesModule],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService]
})
export class TreesModule {}
