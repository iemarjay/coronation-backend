import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  @IsNotEmpty()
  category: string;
}

export class CreateMultipleAssetDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssetDto)
  assets: CreateAssetDto[];
}
