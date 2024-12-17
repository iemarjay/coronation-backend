import { OmitType } from '@nestjs/mapped-types';
import { CreateAssetDto } from './create-asset.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto extends OmitType(CreateAssetDto, [
  'type',
  'sourceType',
]) {
  @IsString()
  @IsOptional()
  name: string;
}
