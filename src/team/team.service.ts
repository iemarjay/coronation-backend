import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamRepository } from './repositories/team.repository';
import { User } from 'src/user/entities/user.entity';
import { Status } from './types';
import { In } from 'typeorm';
import { UserRepository } from 'src/user/repositories/user.repository';
import { AssetRepository } from 'src/asset/repositories/asset.repository';

@Injectable()
export class TeamService {
  constructor(
    protected repository: TeamRepository,
    protected userRepository: UserRepository,
    protected assetRepository: AssetRepository,
  ) {}
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
    date,
    status,
  }: {
    limit: number;
    page: number;
    search?: string;
    status?: Status;
    date?: Date;
  }) {
    return await this.repository.getAllTeams({
      limit: limit ?? 10,
      page: page ?? 1,
      search,
      date,
      status,
    });
  }

  async update(id: string, dto: UpdateTeamDto, user: User) {
    let team = await this.repository.findOne({
      where: {
        id,
      },
    });

    team = {
      ...team,
      ...dto,
    };
    // team.status = dto.status;
    team.lastModifiedBy = user;
    team = await this.repository.save(team);

    return team;
  }

  async remove(id: string) {
    const team = await this.repository.findOneOrFail({
      where: { id },
      relations: ['assets.teams'],
    });
    await this.userRepository.update(
      { team: { id: team.id } },
      { createdBy: null },
    );
    for (const asset of team.assets) {
      asset.teams = asset.teams.filter((t) => t.id !== team.id);
      await this.assetRepository.save(asset);
    }
    await this.repository.delete({ id });
    return {
      message: `${team.name} department deleted successfully`,
    };
  }

  async deleteTeams(ids: string[]) {
    const teams = await this.repository.find({
      where: { id: In(ids) },
      relations: ['assets.teams'],
    });

    if (teams.length === 0) {
      return {
        message: `Departments deleted successfully`,
      };
    }

    for (const team of teams) {
      await this.userRepository.update(
        { team: { id: team.id } },
        { createdBy: null },
      );
      for (const asset of team.assets) {
        asset.teams = asset.teams.filter((t) => t.id !== team.id);
        await this.assetRepository.save(asset);
      }
    }

    await this.repository.remove(teams);

    return {
      message: `${teams.length > 1 ? 'Departments' : 'Department'} deleted successfully`,
    };
  }
}
