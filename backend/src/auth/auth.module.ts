import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { User } from "../users/user.entity"
import { JwtStrategy } from "./jwt.strategy"
import { RolesGuard } from "./roles.guard"

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({})
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController]
})
export class AuthModule {}
