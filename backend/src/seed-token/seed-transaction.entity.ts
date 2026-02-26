import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { User } from "../users/user.entity"

@Entity("seed_transactions")
export class SeedTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @Column({ type: "int" })
  amount: number

  @Column({ name: "tx_id", type: "varchar", length: 255, nullable: true })
  txId: string | null

  @Column({ type: "varchar", length: 20 })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}

