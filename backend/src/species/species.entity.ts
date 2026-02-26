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

  @Column({ name: "biome", nullable: true })
  biome: string

  @Column({ name: "image_url", nullable: true })
  imageUrl: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
