import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Category } from './category.entity';

@Entity()
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Asset, (asset) => asset.subcategory)
  assets: Asset[];

  @ManyToOne(() => Category, (category) => category.subcategories)
  category: Category;
}
