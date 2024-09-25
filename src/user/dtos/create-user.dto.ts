import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Role, Status } from 'src/user/types';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  teamId?: string;

  @IsOptional()
  status?: Status;

  @IsOptional()
  permissions?: string[];
}
