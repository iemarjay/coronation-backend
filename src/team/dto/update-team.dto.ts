import { PickType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Status } from '../types';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(Status)
  status: Status;
}
