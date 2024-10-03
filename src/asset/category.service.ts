import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}
}
