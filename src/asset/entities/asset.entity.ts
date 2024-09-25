import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssetDownload } from './asset-download.entity';
import { Team } from 'src/team/entities/team.entity';
import { AssetVersion } from './asset-version.entity';
import { Category } from './category.entity';
import { AccessType } from '../types';
import { AccessRequest } from './access-request.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: AccessType.private, type: 'varchar', enum: AccessType })
  access: string;

  @Column()
  url: string;

  @Column()
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, {
    nullable: true,
  })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  lastModifiedBy: User;

  @OneToMany(() => AssetVersion, (assetVersion) => assetVersion.asset, {
    cascade: true,
  })
  versions: AssetVersion[];

  @OneToMany(() => AssetDownload, (assetDownload) => assetDownload.asset, {
    cascade: true,
  })
  downloads: AssetDownload[];

  @ManyToOne(() => Category, (category) => category.assets)
  @JoinColumn()
  category: Category;

  @ManyToMany(() => Team, (team) => team.assets)
  @JoinTable({ name: 'asset_teams' })
  teams: Team[];

  @ManyToMany(() => User, (user) => user.assets)
  @JoinTable({ name: 'asset_users' })
  users: User[];

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.asset, {
    cascade: true,
  })
  requests: AccessRequest[];

  @Column({ default: false })
  isPublished: boolean;
}
