import { IsInt, IsString, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsNotEmpty({ message: 'Asset type required' })
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  date?: Date;

  @IsOptional()
  @IsString()
  context?: 'download';
}
