import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
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
  }) {
    const queryOptions: FindManyOptions = {
      order: { updatedAt: 'DESC' },
      take: filter.limit,
      skip: filter.limit * ((filter.page ?? 1) - 1),
      relations: ['permissions', 'team'],
    };
    const whereConditions: any = {};
    if (filter.role) {
      whereConditions.role = filter.role;
    }

    if (filter.status) {
      whereConditions.status = filter.status;
    }

    queryOptions.where = whereConditions;

    return this.find(queryOptions);
  }
}
