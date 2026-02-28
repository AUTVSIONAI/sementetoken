import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tree_estimates')
export class TreeEstimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'municipality_ibge_id', unique: true }) // IBGE code is unique per municipality
  municipalityIbgeId: string;

  @Column({ name: 'municipality_name' })
  municipalityName: string;

  @Column({ length: 2 })
  uf: string;

  @Column()
  biome: string;

  @Column('decimal', { precision: 14, scale: 2, name: 'area_ha' })
  areaHa: number;

  @Column('decimal', { precision: 14, scale: 2, name: 'trees_estimate' })
  treesEstimate: number;

  @Column('decimal', { precision: 14, scale: 2, name: 'tokens_10pct' })
  tokens10Pct: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  lat: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  lon: number;
}
