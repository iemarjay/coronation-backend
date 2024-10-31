import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { Status } from 'src/user/types';

export class ChangeBulkAssetStatusDto {
  @IsArray()
  @IsNotEmpty()
  assetIds: string[];

  @IsEnum(Status)
  @IsNotEmpty()
  status: Status;
}
