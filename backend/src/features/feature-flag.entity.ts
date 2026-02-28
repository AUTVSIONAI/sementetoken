import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryColumn()
  key: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
