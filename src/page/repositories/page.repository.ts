import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Page } from '../entites.ts/page.entity';

@Injectable()
export class PageRepository extends Repository<Page> {
  constructor(private datasource: DataSource) {
    super(Page, datasource.createEntityManager());
  }

  async getSearchResults(search: string) {
    const searchTerm = `%${search}%`;
    const query = this.createQueryBuilder('page')
      .where('page.content LIKE :search', { search: searchTerm })
      .orWhere('page.pageTitle LIKE :search', { search: searchTerm });

    return await query.getMany();
  }
}
