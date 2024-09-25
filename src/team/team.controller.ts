import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import {
  Authenticate,
  AuthUser,
} from 'src/shared/decorators/auth-user.decorator';
import { Role } from 'src/user/types';
import { User } from 'src/user/entities/user.entity';

@Controller('team')
@Authenticate(Role.admin)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @AuthUser() user: User) {
    return this.teamService.create(createTeamDto, user);
  }

  @Get()
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.teamService.getAll({ page, limit });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @AuthUser() user: User,
  ) {
    return this.teamService.update(id, updateTeamDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
