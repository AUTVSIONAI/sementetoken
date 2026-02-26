import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Brigade } from "./brigade.entity"
import { Brigadist } from "./brigadist.entity"
import { BrigadeAction } from "./brigade-action.entity"
import { BrigadeTask } from "./brigade-task.entity"
import { BrigadesService } from "./brigades.service"
import { BrigadesController } from "./brigades.controller"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"
import { GreenTokenModule } from "../green-token/green-token.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brigade,
      Brigadist,
      BrigadeAction,
      BrigadeTask,
      User,
      Tree
    ]),
    GreenTokenModule
  ],
  controllers: [BrigadesController],
  providers: [BrigadesService],
  exports: [BrigadesService]
})
export class BrigadesModule {}
