import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { User } from "../users/user.entity"
import { Tree } from "../trees/tree.entity"

@Entity("tokens")
export class Token {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @ManyToOne(() => Tree)
  @JoinColumn({ name: "tree_id" })
  tree: Tree

  @Column({ name: "waves_tx_id", nullable: true })
  wavesTxId: string | null

  @Column({ type: "float", nullable: true })
  amount: number | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
