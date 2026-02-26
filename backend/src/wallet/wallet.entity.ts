import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { User } from "../users/user.entity"

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @Column({ name: "green_balance", type: "int", default: 0 })
  greenBalance: number

  @Column({ name: "seed_balance", type: "int", default: 0 })
  seedBalance: number

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}

