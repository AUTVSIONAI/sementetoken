import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('brigades')
export class Brigade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

