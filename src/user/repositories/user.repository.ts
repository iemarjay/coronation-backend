import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';

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
}
