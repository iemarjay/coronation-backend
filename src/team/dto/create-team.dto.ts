import { IsNotEmpty } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty()
  name: string;
}
