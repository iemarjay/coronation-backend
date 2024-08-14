import { IsString } from 'class-validator';

export class CreateAssetCategoryDto {
  @IsString()
  name: string;
}
