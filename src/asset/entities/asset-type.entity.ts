import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category.entity';
import { Asset } from './asset.entity';

@Entity()
export class AssetType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Category, (category) => category.assetType, {
    cascade: true,
  })
  categories: Category[];

  @OneToMany(() => Asset, (asset) => asset.assetType)
  assets: Asset[];
}
