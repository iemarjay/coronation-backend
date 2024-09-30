import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role, Status } from '../types';
import { Team } from 'src/team/entities/team.entity';
import { Permission } from './permission.entity';
import { Asset } from 'src/asset/entities/asset.entity';
import { AccessRequest } from 'src/asset/entities/access-request.entity';
import { AssetDownload } from 'src/asset/entities/asset-download.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: Role.staff, type: 'varchar', enum: Role })
  role: Role;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  lastModifiedBy: User;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: Status.inactive, type: 'varchar', enum: Status })
  status: Status;

  @ManyToOne(() => Team, { nullable: true })
  team: Team;

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.user)
  requests: AccessRequest[];

  @ManyToMany(() => Permission)
  @JoinTable({ name: 'user_permissions' })
  permissions: Permission[];

  @ManyToMany(() => Asset, (asset) => asset.users, { nullable: true })
  assets: Asset[];

  @OneToMany(() => AssetDownload, (assetDownload) => assetDownload.user, {
    cascade: true,
  })
  downloads: AssetDownload[];

  get full_name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
