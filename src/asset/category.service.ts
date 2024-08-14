import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryRepository } from './repositories/category.repository';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';

@Injectable()
export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}
  async create(dto: CreateAssetCategoryDto) {
    try {
      const category = await this.categoryRepository.save({
        name: dto.name,
      });
      return category;
    } catch (error) {
      throw new BadRequestException(`"${dto.name}" category already exists`);
    }
  }
}
