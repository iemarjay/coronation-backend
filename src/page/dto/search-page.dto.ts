import { IsString, IsNotEmpty } from 'class-validator';

export class SearchPageQueryDto {
  @IsNotEmpty()
  @IsString()
  q: string;
}
