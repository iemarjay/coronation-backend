import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DataType {
  page = 'page',
  block = 'block',
}

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  documentTitle: string;

  @Column()
  pageTitle: string;

  @Column({ nullable: true, type: 'simple-array' })
  subPagesTitle: string[];

  @Column({ nullable: true, type: 'simple-array' })
  parentPagesTitle: string[];

  @Column({ nullable: true })
  sectionTitle: string;

  @Column()
  documentSlug: string;

  @Column()
  pageSlug: string;

  @Column({ nullable: true })
  sectionSlug: string;

  @Column({ nullable: true, type: 'simple-array' })
  subPagesSlug: string[];

  @Column({ nullable: true, type: 'simple-array' })
  parentPagesSlug: string[];

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  content: string;

  @Column({ type: 'varchar', enum: DataType })
  type: DataType;
}
