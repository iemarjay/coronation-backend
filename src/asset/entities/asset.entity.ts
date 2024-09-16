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
import { Tag } from './tag.entity';
import { Category } from './category.entity';
import { AccessType } from '../types';

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

  @ManyToOne(() => User, (user) => user.createdAssets)
  createdBy: User;

  @OneToMany(() => AssetVersion, (assetVersion) => assetVersion.asset)
  versions: AssetVersion[];

  @OneToMany(() => AssetDownload, (assetDownload) => assetDownload.asset)
  downloads: AssetDownload[];

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'asset_tag' })
  tags: Tag[];

  @ManyToOne(() => Category, (category) => category.assets)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToMany(() => Team)
  @JoinTable({ name: 'asset_team' })
  teams: Team[];

  @ManyToMany(() => User)
  @JoinTable({ name: 'asset_user' })
  users: User[];

  @Column({ default: false })
  isPublished: boolean;
}
