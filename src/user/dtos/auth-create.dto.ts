import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthCreateDto {
  @IsEmail(
    {},
    {
      message: 'Email is invalid',
    },
  )
  @IsNotEmpty({
    message: 'Email is required',
  })
  email: string;
}
