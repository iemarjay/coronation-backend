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
import { Status } from './types';

@Controller('teams')
@Authenticate(Role.admin)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @AuthUser() user: User) {
    return this.teamService.create(createTeamDto, user);
  }

  @Post('all')
  createAllTeams() {
    return this.teamService.createAllTeams();
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('status') status: Status,
    @Query('date') date: Date,
  ) {
    return this.teamService.getAll({ page, limit, search, date, status });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @AuthUser() user: User,
  ) {
    return this.teamService.update(id, updateTeamDto, user);
  }

  @Authenticate(Role.admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }

  @Authenticate(Role.admin)
  @Delete('delete/multiple')
  deleteTeams(@Body() dto: { teamIds: string[] }) {
    return this.teamService.deleteTeams(dto.teamIds);
  }
}
