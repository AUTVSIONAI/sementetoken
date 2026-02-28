import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Brigade } from '../brigades/brigade.entity';

@Entity('tree_lots')
export class TreeLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  biome: string;

  @ManyToOne(() => Brigade, { nullable: true })
  @JoinColumn({ name: 'brigade_id' })
  brigade: Brigade;

  @Column({ name: 'total_trees', type: 'int', default: 0 })
  totalTrees: number;

  @Column({ name: 'available_trees', type: 'int', default: 0 })
  availableTrees: number;

  @Column({ name: 'experience_enabled', default: false })
  experienceEnabled: boolean;

  @Column({ name: 'tourism_enabled', default: false })
  tourismEnabled: boolean;

  @Column({ name: 'corporate_enabled', default: false })
  corporateEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
