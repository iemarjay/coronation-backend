import { Controller, Post, Body } from '@nestjs/common';
import { Authenticate } from 'src/shared/decorators/auth-user.decorator';
import { Role } from 'src/user/types';
import { CategoryService } from '../category.service';
import { CreateAssetCategoryDto } from '../dto/create-asset-category.dto';

@Controller('asset/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Authenticate(Role.admin)
  @Post('')
  create(@Body() dto: CreateAssetCategoryDto) {
    return this.categoryService.create(dto);
  }
}
