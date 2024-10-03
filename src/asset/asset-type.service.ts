import { BadRequestException, Injectable } from '@nestjs/common';
import { AssetTypeRepository } from './repositories/asset-type.repository';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { AssetType } from './entities/asset-type.entity';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { SubcategoryRepository } from './repositories/subcategory.repository';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class AssetTypeService {
  constructor(
    private assetTypeRepository: AssetTypeRepository,
    private categoryRepository: CategoryRepository,
    private subcategoryRepository: SubcategoryRepository,
  ) {}

  async createAssetType(dto: CreateAssetTypeDto) {
    if (await this.assetTypeRepository.findOneBy({ name: dto.name })) {
      throw new BadRequestException(`Asset type ${dto.name} already exists`);
    }
    const assetType = new AssetType();
    assetType.name = dto.name;
    await this.assetTypeRepository.save(assetType);

    if (dto.categories?.length) {
      for (const categoryDto of dto.categories) {
        const newCategory = new Category();
        newCategory.name = categoryDto.name;
        newCategory.assetType = assetType;
        await this.categoryRepository.save(newCategory);
        if (categoryDto.subcategories?.length) {
          for (const subcategoryDto of categoryDto.subcategories) {
            const subcategory = new Subcategory();
            subcategory.name = subcategoryDto.name;
            subcategory.category = newCategory;
            await this.subcategoryRepository.save(subcategory);
          }
        }
      }
    }
    return assetType;
  }

  async getAssetTypes() {
    return await this.assetTypeRepository.find({
      relations: ['categories', 'categories.subcategories'],
    });
  }
}
