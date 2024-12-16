import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AssetSourceType {
  SharePoint = 'sharepoint',
  File = 'file',
}

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

  @IsEnum(AssetSourceType)
  @IsNotEmpty()
  sourceType: AssetSourceType;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsString()
  @IsOptional()
  fileUrl: string;

  @IsString({ each: true })
  @IsOptional()
  teams?: string[];

  @IsString({ each: true })
  @IsOptional()
  users?: string[];
}
