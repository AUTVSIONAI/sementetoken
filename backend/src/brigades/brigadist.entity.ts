import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Brigade } from './brigade.entity';

@Entity('brigadists')
export class Brigadist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Brigade)
  @JoinColumn({ name: 'brigade_id' })
  brigade: Brigade;

  @Column()
  name: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

