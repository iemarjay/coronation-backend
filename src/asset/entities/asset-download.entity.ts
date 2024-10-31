import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Asset } from './asset.entity';

@Entity()
export class AssetDownload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.downloads, { onDelete: 'CASCADE' })
  asset: Asset;

  @ManyToOne(() => User, (user) => user.downloads)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
