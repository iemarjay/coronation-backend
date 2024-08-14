import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity()
export class AssetVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  url: string;

  @ManyToOne(() => Asset, (asset) => asset.versions)
  asset: Asset;

  @CreateDateColumn()
  createdAt: Date;
}
