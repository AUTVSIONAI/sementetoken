import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Tree } from "../trees/tree.entity"
import { DashboardService } from "./dashboard.service"
import { DashboardController } from "./dashboard.controller"
import { SemeModule } from "../seme/seme.module"

@Module({
  imports: [TypeOrmModule.forFeature([Tree]), SemeModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}

