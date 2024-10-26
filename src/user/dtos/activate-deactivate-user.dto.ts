import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Status } from '../types';

export class ActivateDeactvateUserDto {
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(Status, {
    message: 'status must be one of the following values: Active, Inactive',
  })
  status: Status;
}
