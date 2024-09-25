import { PickType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateTeamDto extends PickType(CreateTeamDto, ['name'] as const) {
  @IsNotEmpty()
  name: string;
}
