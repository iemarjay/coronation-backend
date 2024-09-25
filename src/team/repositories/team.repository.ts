import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { Team } from '../entities/team.entity';

@Injectable()
export class TeamRepository extends Repository<Team> {
  constructor(private datasource: DataSource) {
    super(Team, datasource.createEntityManager());
  }

  getAllTeams(filter: { limit: number; page: number }) {
    const queryOptions: FindManyOptions = {
      order: { updatedAt: 'DESC' },
      take: filter.limit,
      skip: filter.limit * ((filter.page ?? 1) - 1),
      relations: ['createdBy', 'lastModifiedBy'],
    };

    return this.find(queryOptions);
  }
}
