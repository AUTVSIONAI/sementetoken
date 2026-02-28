import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from "typeorm"

@Entity("species")
export class Species {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "common_name" })
  commonName: string

  @Column({ name: "scientific_name", nullable: true })
  scientificName: string

  @Column({ name: "slug", unique: true, nullable: true })
  slug: string

  @Column({ name: "biome", nullable: true })
  biome: string

  @Column({ name: "base_cost", type: "float", default: 50 })
  baseCost: number

  @Column({ name: "sale_price", type: "float", default: 100 })
  salePrice: number

  @Column({ name: "carbon_estimation", type: "float", default: 0 })
  carbonEstimation: number

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ name: "image_url", nullable: true })
  imageUrl: string

  @Column({ name: "is_official", default: false })
  isOfficial: boolean

  @Column({ default: "ACTIVE" })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
