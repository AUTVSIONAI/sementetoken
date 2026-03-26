import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Product } from "./product.entity"
import { ProductsController } from "./products.controller"
import { ProductsService } from "./products.service"
import { Species } from "../species/species.entity"
import { Project } from "../projects/project.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Product, Species, Project])],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}

