import { Controller } from '@nestjs/common';

import { CategoryService } from '../category.service';

@Controller('asset/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
}
