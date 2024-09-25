import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Role, Status } from '../types';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private datasource: DataSource) {
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
  }) {
    const query = this.createQueryBuilder('user')
      .leftJoinAndSelect('user.permissions', 'permissions')
      .leftJoinAndSelect('user.team', 'team')
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

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      query.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: searchTerm },
      );
    }

    return query.getMany();
  }
}
