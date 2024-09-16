import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToMany(() => Asset)
  assets: Asset[];
}
