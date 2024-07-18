import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/user/types';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  first_name: string;

  @IsEnum(Role)
  role: Role;
}
