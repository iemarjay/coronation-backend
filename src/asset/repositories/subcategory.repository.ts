import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Subcategory } from '../entities/subcategory.entity';

@Injectable()
export class SubcategoryRepository extends Repository<Subcategory> {
  constructor(private datasource: DataSource) {
    super(Subcategory, datasource.createEntityManager());
  }
}
