import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Role, Status } from '../types';
import { TeamRepository } from 'src/team/repositories/team.repository';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(
    private datasource: DataSource,
    protected teamRepository: TeamRepository,
  ) {
    super(User, datasource.createEntityManager());
  }

  async credentialsExists(dto: CreateUserDto, id?: string) {
    const user = await this.findOneBy([{ email: dto.email }]);
    if (id && user?.id === id) return false;
    else if (user) return true;
    return false;
  }

  async findBAdminByEmailOrFail(email: string) {
    return await this.findOneOrFail({
      where: { email, role: Role.admin },
    });
  }

  async getAllUsers(filter: {
    limit: number;
    page: number;
    role?: Role;
    status?: Status;
    search?: string;
    team?: string;
    date?: string;
  }) {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.permissions', 'permissions')
      .leftJoinAndSelect('user.team', 'team')
      .leftJoinAndSelect('user.createdBy', 'createdBy')
      .leftJoinAndSelect('user.lastModifiedBy', 'lastModifiedBy')
      .orderBy('user.updatedAt', 'DESC')
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1));

    if (filter.role) {
      const roles = filter.role.replaceAll(' ', '').split(',');
      query.andWhere('user.role IN (:...roles)', { roles });
    }

    if (filter.status) {
      query.andWhere('user.status = :status', { status: filter.status });
    }

    if (filter.team) {
      query.andWhere('team.name = :name', { name: filter.team });
    }

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      query.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: searchTerm.toLocaleLowerCase() },
      );
    }

    if (filter.date) {
      query.andWhere('CONVERT(date,[user].createdAt) = :date', {
        date: filter.date,
      });
    }

    const [users, totalCount] = await query.getManyAndCount();

    const totalPages = Math.ceil(totalCount / filter.limit);

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount: totalCount,
      totalPages: totalPages,
      users,
    };
  }

  async getAllTeamsAndUsers() {
    const teams = await this.teamRepository.find({
      select: ['id', 'name'],
    });

    const users = await this.find({
      select: ['id', 'firstName', 'role', 'email'],
    });

    return {
      users,
      teams,
    };
  }
}
