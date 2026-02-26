import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"

@Entity("conversions")
export class Conversion {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @Column({ name: "green_spent", type: "int" })
  greenSpent: number

  @Column({ name: "seed_generated", type: "int" })
  seedGenerated: number

  @ManyToOne(() => Tree, { nullable: true })
  @JoinColumn({ name: "tree_id" })
  tree: Tree | null

  @Column({
    name: "blockchain_tx_id",
    type: "varchar",
    length: 255,
    nullable: true
  })
  blockchainTxId: string | null

  @Column({ type: "varchar", length: 20 })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}

