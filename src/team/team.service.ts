import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamRepository } from './repositories/team.repository';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class TeamService {
  constructor(protected repository: TeamRepository) {}
  async create(dto: CreateTeamDto, user: User) {
    return await this.repository.save({
      ...dto,
      createdBy: user,
      lastModifiedBy: user,
    });
  }

  async getAll({
    limit,
    page,
    search,
  }: {
    limit: number;
    page: number;
    search: string;
  }) {
    return await this.repository.getAllTeams({
      limit: limit ?? 10,
      page: page ?? 1,
      search,
    });
  }

  async update(id: string, dto: UpdateTeamDto, user: User) {
    const team = await this.repository.findOne({
      where: {
        id,
      },
    });

    team.name = dto.name;
    team.lastModifiedBy = user;
    await this.repository.save(team);

    return team;
  }

  async remove(id: string) {
    const team = await this.repository.findOneByOrFail({ id });
    await this.repository.delete({ id });
    return {
      message: `${team.name} team deleted`,
    };
  }
}
