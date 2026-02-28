import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { TreeLot } from '../lots/tree-lot.entity';

@Entity('tree_experience')
export class TreeExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => TreeLot)
  @JoinColumn({ name: 'lot_id' })
  lot: TreeLot;

  @Column({ name: 'trees_owned', type: 'int' })
  treesOwned: number;

  @Column({ name: 'invitation_status', default: 'pending' })
  invitationStatus: string;

  @Column({ name: 'event_date', type: 'timestamp', nullable: true })
  eventDate: Date;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
