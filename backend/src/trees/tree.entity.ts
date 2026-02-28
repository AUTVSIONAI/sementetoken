import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Species } from '../species/species.entity';
import { Brigade } from '../brigades/brigade.entity';
import { TreeLot } from '../lots/tree-lot.entity';

export enum TreeStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  MINTED = 'minted',
  SOLD = 'sold'
}

@Entity('trees')
export class Tree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Species, { nullable: true })
  @JoinColumn({ name: 'species_id' })
  speciesType: Species;

  @ManyToOne(() => Brigade, { nullable: true })
  @JoinColumn({ name: 'brigade_id' })
  brigade: Brigade;

  @ManyToOne(() => TreeLot, { nullable: true })
  @JoinColumn({ name: 'lot_id' })
  lot: TreeLot;

  @Column({ nullable: true })
  species: string; // Deprecated, use speciesType

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string;

  @Column({
    type: 'enum',
    enum: TreeStatus,
    default: TreeStatus.PENDING
  })
  status: TreeStatus;

  @Column({ name: 'tx_hash', nullable: true })
  txHash: string;

  @Column({ nullable: true })
  biome: string;

  @Column({ nullable: true })
  state: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: any;

  @Column({ name: 'planted_at', nullable: true })
  plantedAt: Date;

  @Column({ name: 'growth_stage', nullable: true })
  growthStage: string;

  @Column({ name: 'estimated_co2_total', type: 'float', nullable: true })
  estimatedCo2Total: number;

  @Column({ name: 'nft_id', nullable: true })
  nftId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
