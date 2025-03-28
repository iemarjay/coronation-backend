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
  UpdateDateColumn,
} from 'typeorm';
import { AssetDownload } from './asset-download.entity';
import { Team } from 'src/team/entities/team.entity';
import { AssetVersion } from './asset-version.entity';
import { Category } from './category.entity';
import { AccessRequest } from './access-request.entity';
import { AssetType } from './asset-type.entity';
import { Subcategory } from './subcategory.entity';
import { Status } from 'src/user/types';
import { AssetSourceType } from '../dto/create-asset.dto';
import { Exclude } from 'class-transformer';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column()
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  size: number;

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

  @ManyToOne(() => Category, (category) => category.assets, {
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.assets, {
    nullable: true,
  })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory: Subcategory;

  @ManyToMany(() => Team, (team) => team.assets, {
    cascade: true,
  })
  @JoinTable({ name: 'asset_teams' })
  teams: Team[];

  @ManyToMany(() => User, (user) => user.assets, {
    cascade: true,
  })
  @JoinTable({ name: 'asset_users' })
  users: User[];

  @OneToMany(() => AccessRequest, (accessRequest) => accessRequest.asset, {
    cascade: true,
  })
  requests: AccessRequest[];

  @Column({ default: Status.inactive, type: 'varchar', enum: Status })
  status: Status;

  @Column({
    default: AssetSourceType.File,
    type: 'varchar',
    enum: AssetSourceType,
  })
  @Exclude()
  sourceType: AssetSourceType;

  @ManyToOne(() => AssetType, (assetType) => assetType.assets)
  assetType: AssetType;
}
