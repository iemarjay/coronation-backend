import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Asset } from './asset.entity';
import { AssetType } from './asset-type.entity';
import { Subcategory } from './subcategory.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Asset, (asset) => asset.category)
  assets: Asset[];

  @ManyToOne(() => AssetType, (assetType) => assetType.categories)
  assetType: AssetType;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.category, {
    cascade: true,
  })
  subcategories: Subcategory[];
}
