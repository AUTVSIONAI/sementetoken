import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Project } from '../projects/project.entity';

@Entity('trees')
export class Tree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column()
  species: string;

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
