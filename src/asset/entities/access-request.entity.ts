// src/assets/entities/access-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
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

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'varchar',
    enum: AccessRequestStatus,
    default: AccessRequestStatus.pending,
  })
  status: AccessRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
