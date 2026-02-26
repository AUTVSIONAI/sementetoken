import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { User } from "../users/user.entity"

@Entity("green_transactions")
export class GreenTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @Column({ type: "int" })
  amount: number

  @Column({ type: "varchar", length: 20 })
  type: string

  @Column({ type: "varchar", length: 30 })
  source: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}

