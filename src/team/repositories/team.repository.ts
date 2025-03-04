import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Team } from '../entities/team.entity';
import { Status } from '../types';

@Injectable()
export class TeamRepository extends Repository<Team> {
  constructor(private datasource: DataSource) {
    super(Team, datasource.createEntityManager());
  }

  async findByNameOrCreate(name: string) {
    const existingTeam = await this.findOne({ where: { name } });
    if (existingTeam) return existingTeam;

    const newTeam = this.create({ name, status: Status.active });
    return await this.save(newTeam);
  }

  async getAllTeams(filter: {
    limit: number;
    page: number;
    search?: string;
    status?: Status;
    date?: Date;
  }) {
    const query = this.createQueryBuilder('team')
      .leftJoinAndSelect('team.createdBy', 'createdBy')
      .leftJoinAndSelect('team.users', 'users')
      .leftJoinAndSelect('team.lastModifiedBy', 'lastModifiedBy')
      .orderBy('team.name', 'ASC')
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1));

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      query.andWhere('team.name LIKE :search', { search: searchTerm });
    }

    if (filter.date) {
      query.andWhere('CONVERT(date,team.createdAt) = :date', {
        date: filter.date,
      });
    }

    if (filter.status) {
      query.andWhere('team.status = :status', {
        status: filter.status,
      });
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
