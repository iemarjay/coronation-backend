import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Status } from 'src/user/types';

export class ChangeAssetStatusDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;
}
