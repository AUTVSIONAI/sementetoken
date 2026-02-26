import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('nft_metadata')
export class NftMetadata {
  @PrimaryColumn({ name: 'token_id' })
  tokenId: string;

  @Column({ name: 'owner_address' })
  ownerAddress: string;

  @Column({ nullable: true })
  species: string;

  @Column({ nullable: true })
  biome: string;

  @Column({ name: 'planting_date', type: 'timestamp with time zone', nullable: true })
  plantingDate: Date;

  @Column({ name: 'estimated_co2', type: 'float', nullable: true })
  estimatedCo2: number;

  @Column({ name: 'block_number', type: 'int', nullable: true })
  blockNumber: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
