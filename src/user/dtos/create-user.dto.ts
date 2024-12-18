import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role, Status } from 'src/user/types';

export class CreateUserDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email required' })
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsEnum(Role, {
    message: 'role must be one of the following values: admin, staff, vendor',
  })
  @IsNotEmpty({ message: 'role is required' })
  role: Role;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(Status, {
    message: 'status must be one of the following values: Active, Inactive',
  })
  status?: Status;

  @IsOptional()
  @IsArray()
  permissions?: string[];
}
