import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule } from "@nestjs/config"
import { SemeTransaction } from "./seme-transaction.entity"
import { NftMetadata } from "./nft-metadata.entity"
import { SemeService } from "./seme.service"
import { SemeListenerService } from "./seme-listener.service"
import { SemeController } from "./seme.controller"

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([SemeTransaction, NftMetadata])],
  providers: [SemeService, SemeListenerService],
  controllers: [SemeController],
  exports: [SemeService]
})
export class SemeModule {}

