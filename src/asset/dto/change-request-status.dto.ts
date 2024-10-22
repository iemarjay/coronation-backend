import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccessRequestStatus } from '../types';

export class ChangeRequestStatusDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(AccessRequestStatus)
  @IsNotEmpty()
  status: AccessRequestStatus;
}
