import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import { Role, Status } from 'src/user/types';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { StorageService } from 'src/shared/storage.service';
import { CategoryRepository } from './category.repository';
import { AccessRequestRepository } from './access-request.repository';
import { AssetDownloadRepository } from './access-download.repository';
import { AssetTypeRepository } from './asset-type.repository';
import { AssetVersion } from '../entities/asset-version.entity';
import { Subcategory } from '../entities/subcategory.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class AssetRepository extends Repository<Asset> {
  constructor(
    private readonly datasource: DataSource,
    private readonly storage: StorageService,
    private categoryRepository: CategoryRepository,
    private assetTypeRepository: AssetTypeRepository,
    private accessRequestRepository: AccessRequestRepository,
    private assetDownloadRepository: AssetDownloadRepository,
  ) {
    super(Asset, datasource.createEntityManager());
  }

  async createAsset(
    user: User,
    file: Express.Multer.File,
    dto: CreateAssetDto,
  ) {
    let uploadedFile: string | null = null;
    let category: Category | null = null;
    let subcategory: Subcategory | null = null;
    try {
      const assetType = await this.assetTypeRepository.findOne({
        where: {
          id: dto.type,
        },
        relations: ['categories', 'categories.subcategories'],
      });
      if (!assetType) {
        throw new BadRequestException('Asset type not found');
      }

      if (assetType?.categories.length && !dto.category) {
        throw new BadRequestException(
          'Category is required for this asset type.',
        );
      } else if (!assetType.categories.length && dto.category) {
        throw new BadRequestException(
          'Category is not applicable for this asset type.',
        );
      } else if (dto.category) {
        category = assetType.categories.find(
          (item) => item.id === dto.category,
        );
        if (!category) {
          throw new BadRequestException(
            'Provided category does not exist within this asset type.',
          );
        }
      }

      if (category?.subcategories.length && !dto.subcategory) {
        throw new BadRequestException(
          `Subcategory is required for ${category.name} category`,
        );
      }

      if (dto.subcategory && category.subcategories?.length) {
        subcategory = category.subcategories.find(
          (s) => s.id === dto.subcategory,
        );
        if (!subcategory) {
          throw new BadRequestException(
            'Provided subcategory does not exist within this asset type.',
          );
        }
      }

      const name = `${dto.name}${path.extname(file.originalname).toLowerCase()}`;
      uploadedFile = await this.storage.upload(file, name);

      const asset = this.create({
        name,
        type: file.mimetype,
        size: file.size,
        createdBy: user,
        lastModifiedBy: user,
        url: uploadedFile,
        assetType,
      });

      const assetVersion = new AssetVersion();
      assetVersion.path = uploadedFile;
      assetVersion.url = uploadedFile;
      assetVersion.asset = asset;

      if (dto.category) {
        asset.category = category;
      }
      if (dto.subcategory) {
        asset.subcategory = subcategory;
      }

      asset.versions = [assetVersion];
      await this.save(asset);

      return asset;
    } catch (error) {
      if (uploadedFile) {
        await this.storage.deleteFile(uploadedFile);
      }
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        console.log(error);
        throw new InternalServerErrorException('Failed to upload asset');
      }
    }
  }

  async findAssetOrFail(id: string) {
    let asset: Asset;
    try {
      asset = await this.findOneOrFail({
        where: {
          id,
        },
        relations: ['versions', 'downloads', 'users', 'teams'],
      });
    } catch (error) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async findAll(filter: {
    limit: number;
    page: number;
    user: User;
    search?: string;
    type: string;
    category?: string;
    subcategory?: string;
  }) {
    const query = this.createQueryBuilder('asset');

    query
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1))
      .orderBy('asset.createdAt', 'DESC');

    if (![Role.admin].includes(filter.user.role)) {
      query.andWhere('asset.status = :status', { status: Status.active });
    }
    query
      .leftJoinAndSelect('asset.versions', 'versions')
      .leftJoinAndSelect('asset.users', 'users')
      .leftJoinAndSelect('asset.teams', 'teams')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.subcategory', 'subcategory')
      .leftJoinAndSelect('asset.createdBy', 'createdBy')
      .leftJoinAndSelect('asset.lastModifiedBy', 'lastModifiedBy')
      .andWhere('assetType.name = :type', { type: filter.type });

    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      query.andWhere('asset.name LIKE :search', { search: searchTerm });
    }

    if (filter.category) {
      query.andWhere('category.name = :value', { value: filter.category });
    }

    if (filter.subcategory) {
      query.andWhere('subcategory.name = :name', { name: filter.subcategory });
    }

    const [assets, totalCount] = await query.getManyAndCount();

    const totalPages = Math.ceil(totalCount / filter.limit);

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount: totalCount,
      totalPages: totalPages,
      assets,
    };
  }
}
