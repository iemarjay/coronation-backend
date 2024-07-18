import { IsEmail } from 'class-validator';

export class AuthCreateDto {
  @IsEmail()
  email: string;
}
