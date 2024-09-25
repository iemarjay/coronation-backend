import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from 'src/user/services/user.service';
import { CreateUserDto } from 'src/user/dtos/create-user.dto';
import { Role, Status } from '../types';
import {
  Authenticate,
  AuthUser,
} from 'src/shared/decorators/auth-user.decorator';
import { AuthGuard as JwtAuthGuard } from '@nestjs/passport';

import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PermissionService } from '../services/permission.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  @Authenticate(Role.admin)
  @Post('create')
  create(@Body() dto: CreateUserDto, @AuthUser() user: User) {
    return this.userService.create(dto, user);
  }

  @Post('create/super')
  @UseGuards(JwtAuthGuard('jwt'))
  async oktaLogin(@Req() req) {
    return this.userService.createSuperUser(req.user);
  }

  @Authenticate(Role.admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @AuthUser() user: User,
  ) {
    return this.userService.updateUser(id, dto, user);
  }

  @Authenticate()
  @Get('me')
  get(@AuthUser() user: User) {
    return user;
  }

  @Authenticate()
  @Get('permissions')
  getAllPermissions() {
    return this.permissionService.getAll();
  }

  @Authenticate(Role.admin)
  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('role') role: Role,
    @Query('status') status: Status,
    @Query('search') search: string,
  ) {
    return this.userService.getAllUsers({ page, limit, role, status, search });
  }
}
