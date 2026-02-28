import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('travel_partners')
export class TravelPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // hotel, airline, tour

  @Column({ name: 'api_enabled', default: false })
  apiEnabled: boolean;

  @Column({ name: 'api_provider', nullable: true })
  apiProvider: string; // ex: skyscanner

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
