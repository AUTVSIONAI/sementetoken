import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common"
import { ProductsService } from "./products.service"
import { Product } from "./product.entity"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { RolesGuard } from "../auth/roles.guard"
import { Roles } from "../auth/roles.decorator"
import { UserRole } from "../users/user.entity"

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(
    @Body()
    body: {
      name: string
      description?: string
      price: number
      carbonCashbackKg?: number
      projectId?: string | null
    }
  ): Promise<Product> {
    return this.productsService.create(body)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(":id")
  remove(@Param("id") id: string): Promise<void> {
    return this.productsService.delete(id)
  }
}
