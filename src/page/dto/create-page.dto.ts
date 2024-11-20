import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DataType } from '../entites.ts/page.entity';

export class CreatePageDto {
  @IsString()
  url: string;

  @IsString()
  documentTitle: string;

  @IsString()
  pageTitle: string;

  @IsOptional()
  subPagesTitle?: string[];

  @IsOptional()
  parentPagesTitle?: string[];

  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsEnum(DataType)
  type: DataType;
}
