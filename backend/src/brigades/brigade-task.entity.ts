import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm"
import { Brigade } from "./brigade.entity"
import { Brigadist } from "./brigadist.entity"

@Entity("brigade_tasks")
export class BrigadeTask {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(() => Brigade)
  @JoinColumn({ name: "brigade_id" })
  brigade: Brigade

  @ManyToOne(() => Brigadist)
  @JoinColumn({ name: "brigadist_id" })
  brigadist: Brigadist

  @Column()
  title: string

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ default: "pending" })
  status: string

  @Column({ type: "timestamp", name: "due_date", nullable: true })
  dueDate: Date | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}

