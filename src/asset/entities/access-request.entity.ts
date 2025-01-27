// src/assets/entities/access-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { AccessRequestStatus } from '../types';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class AccessRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.requests, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Asset, (asset) => asset.requests, {
    eager: true,
    onDelete: 'CASCADE',
  })
  asset: Asset;

  @Column({
    type: 'varchar',
    enum: AccessRequestStatus,
    default: AccessRequestStatus.pending,
  })
  status: AccessRequestStatus;

  @ManyToOne(() => User, {
    nullable: true,
  })
  updatedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
