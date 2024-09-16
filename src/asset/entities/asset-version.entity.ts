import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class AssetVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  url: string;

  @ManyToOne(() => Asset, (asset) => asset.versions)
  @JoinColumn({ name: 'assetId' })
  @Exclude({ toPlainOnly: true })
  asset: Asset;

  @Column()
  assetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
