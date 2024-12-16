import { OmitType } from '@nestjs/mapped-types';
import { AssetSourceType, CreateAssetDto } from './create-asset.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto extends OmitType(CreateAssetDto, ['type']) {
  @IsString()
  @IsOptional()
  name: string;

  @IsEnum(AssetSourceType)
  @IsNotEmpty()
  sourceType: AssetSourceType;
}
