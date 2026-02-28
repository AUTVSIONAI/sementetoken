import { Module } from "@nestjs/common"
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from "path"
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
import { StripeModule } from "./stripe/stripe.module"
import { BlockchainModule } from "./blockchain/blockchain.module"
import { NftModule } from "./nft/nft.module"
import { EsgModule } from "./esg/esg.module"
import { LotsModule } from "./lots/lots.module"
import { ExperienceModule } from "./experience/experience.module"
import { TourismModule } from "./tourism/tourism.module"
import { FeaturesModule } from "./features/features.module"
import { TokenomicsModule } from "./tokenomics/tokenomics.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
      dropSchema: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
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
    SemeModule,
    StripeModule,
    BlockchainModule,
    NftModule,
    EsgModule,
    LotsModule,
    ExperienceModule,
    TourismModule,
    FeaturesModule,
    TokenomicsModule
  ]
})
export class AppModule {}
