import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty } from 'class-validator';
import { AuthCreateDto } from './auth-create.dto';

export class AuthVerifyDto extends PartialType(AuthCreateDto) {
  @IsNotEmpty()
  code: string;
}
