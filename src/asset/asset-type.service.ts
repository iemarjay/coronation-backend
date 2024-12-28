import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { AssetTypeRepository } from './repositories/asset-type.repository';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { AssetType } from './entities/asset-type.entity';
import { Category } from './entities/category.entity';
import { Subcategory } from './entities/subcategory.entity';
import { SubcategoryRepository } from './repositories/subcategory.repository';
import { CategoryRepository } from './repositories/category.repository';
import { assetTypeData } from './asset-type.data';

@Injectable()
export class AssetTypeService implements OnModuleInit {
  constructor(
    private assetTypeRepository: AssetTypeRepository,
    private categoryRepository: CategoryRepository,
    private subcategoryRepository: SubcategoryRepository,
  ) {}

  async onModuleInit() {
    await this.initializeAssetTypes();
  }

  private async initializeAssetTypes() {
    for (const type of assetTypeData) {
      const existingPermission = await this.assetTypeRepository.findOneBy({
        name: type.name,
      });
      if (!existingPermission) {
        await this.createAssetType(type);
      }
    }

    const found = await this.assetTypeRepository.findOne({
      where: {
        name: 'animations',
      },
    });
    if (found) {
      await this.assetTypeRepository.delete(found);
    }

    const stationary = await this.assetTypeRepository.findOne({
      where: {
        name: 'stationary',
      },
    });
    if (stationary) {
      await this.assetTypeRepository.delete(stationary);
    }
  }

  async createAssetType(dto: CreateAssetTypeDto) {
    dto.name = dto.name.toLowerCase();
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
