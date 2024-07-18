import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { Role } from '../types';
import { Authenticate } from 'src/shared/decorators/auth-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authenticate(Role.admin)
  @Post('create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
