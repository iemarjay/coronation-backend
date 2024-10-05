import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsArray({ each: true })
  @IsOptional()
  teams?: string[];

  @IsArray({ each: true })
  @IsOptional()
  users?: string[];
}
