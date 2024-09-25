import { Asset } from 'src/asset/entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Status } from '../types';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: Status.inactive, type: 'varchar', enum: Status })
  status: Status;

  @OneToMany(() => User, (user) => user.team)
  users: User[];

  @ManyToMany(() => Asset, (asset) => asset.teams)
  assets: Asset[];

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  lastModifiedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
