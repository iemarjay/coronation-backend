import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/user/types';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEnum(Role)
  role: Role;
}
