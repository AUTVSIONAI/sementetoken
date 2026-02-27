import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftMetadata } from '../seme/nft-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NftMetadata])],
  providers: [NftService],
  exports: [NftService],
})
export class NftModule {}
