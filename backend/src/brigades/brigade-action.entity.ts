import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm"
import { Brigade } from "./brigade.entity"
import { Brigadist } from "./brigadist.entity"
import { Tree } from "../trees/tree.entity"
import { Project } from "../projects/project.entity"

@Entity("brigade_actions")
export class BrigadeAction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Brigade)
  @JoinColumn({ name: "brigade_id" })
  brigade: Brigade

  @ManyToOne(() => Brigadist, { nullable: true })
  @JoinColumn({ name: "brigadist_id" })
  brigadist: Brigadist

  @ManyToOne(() => Tree, { nullable: true })
  @JoinColumn({ name: "tree_id" })
  tree: Tree

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "project_id" })
  project: Project

  @Column()
  type: string

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ default: "pending" })
  status: string

  @Column({ name: "media_url", type: "text", nullable: true })
  mediaUrl: string | null

  @Column({ name: "media_type", type: "varchar", length: 20, nullable: true })
  mediaType: string | null

  @Column({
    name: "media_duration_seconds",
    type: "int",
    nullable: true
  })
  mediaDurationSeconds: number | null

  @Index({ spatial: true })
  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true
  })
  location: any

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
