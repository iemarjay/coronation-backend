import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../types';
import { Team } from 'src/team/entities/team.entity';
import { Exclude } from 'class-transformer';
import { Asset } from 'src/asset/entities/asset.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: Role.staff, type: 'enum', enum: Role })
  role: Role;

  @Column({ default: false })
  @Exclude()
  isAdmin: boolean;

  @OneToMany(() => Asset, (asset) => asset.createdBy)
  createdAssets: Asset[];

  @ManyToOne(() => Team)
  team: Team;

  get full_name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
