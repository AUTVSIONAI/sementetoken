import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule } from "@nestjs/config"
import { UsersModule } from "./users/users.module"
import { TreesModule } from "./trees/trees.module"
import { ProjectsModule } from "./projects/projects.module"
import { AiModule } from "./ai/ai.module"
import { AuthModule } from "./auth/auth.module"
import { DashboardModule } from "./dashboard/dashboard.module"
import { SpeciesModule } from "./species/species.module"
import { ProductsModule } from "./products/products.module"
import { OrdersModule } from "./orders/orders.module"
import { AdminModule } from "./admin/admin.module"
import { BrigadesModule } from "./brigades/brigades.module"
import { WalletModule } from "./wallet/wallet.module"
import { GreenTokenModule } from "./green-token/green-token.module"
import { SeedTokenModule } from "./seed-token/seed-token.module"
import { ConversionsModule } from "./conversions/conversions.module"
import { SemeModule } from "./seme/seme.module"

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || "admin",
      password: process.env.DB_PASSWORD || "sementetoken",
      database: process.env.DB_NAME || "sementetoken",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true
    }),
    UsersModule,
    TreesModule,
    ProjectsModule,
    AiModule,
    AuthModule,
    DashboardModule,
    SpeciesModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
    BrigadesModule,
    WalletModule,
    GreenTokenModule,
    SeedTokenModule,
    ConversionsModule,
    SemeModule
  ]
})
export class AppModule {}
