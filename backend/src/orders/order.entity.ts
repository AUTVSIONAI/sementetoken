import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'total_amount', type: 'float' })
  totalAmount: number;

  @Column({ name: 'total_carbon_cashback_kg', type: 'float', default: 0 })
  totalCarbonCashbackKg: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

