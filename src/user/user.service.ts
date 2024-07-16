import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class UserService {
  create(dto: CreateUserDto) {
    return 'This action adds a new user';
  }
}
