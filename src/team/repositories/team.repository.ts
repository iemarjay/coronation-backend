import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Team } from '../entities/team.entity';

@Injectable()
export class TeamRepository extends Repository<Team> {
  constructor(private datasource: DataSource) {
    super(Team, datasource.createEntityManager());
  }

  async getAllTeams(filter: { limit: number; page: number; search?: string }) {
    const query = this.createQueryBuilder('team')
      .leftJoinAndSelect('team.createdBy', 'createdBy')
      .leftJoinAndSelect('team.lastModifiedBy', 'lastModifiedBy')
      .orderBy('team.updatedAt', 'DESC')
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1));

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      query.andWhere('team.name LIKE :search', { search: searchTerm });
    }

    const [teams, totalCount] = await query.getManyAndCount();

    const totalPages = Math.ceil(totalCount / filter.limit);

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount: totalCount,
      totalPages: totalPages,
      teams,
    };
  }
}
