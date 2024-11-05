import { IsString, IsNotEmpty } from 'class-validator';

export class SearchPageQueryDto {
  q: string;
}
