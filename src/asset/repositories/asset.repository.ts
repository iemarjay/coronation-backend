import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/types';
import { CreateMultipleAssetDto } from '../dto/create-asset.dto';
import { StorageService } from 'src/shared/storage.service';
import { CategoryRepository } from './category.repository';
import { TagRepository } from './tag.repository';
import { AccessRequestRepository } from './access-request.repository';
import { AssetDownloadRepository } from './access-download.repository';
import { AssetVersion } from '../entities/asset-version.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class AssetRepository extends Repository<Asset> {
  constructor(
    private datasource: DataSource,
    private storage: StorageService,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private accessRequestRepository: AccessRequestRepository,
    private assetDownloadRepository: AssetDownloadRepository,
  ) {
    super(Asset, datasource.createEntityManager());
  }

  async createMany(
    user: User,
    files: Express.Multer.File[],
    dto: CreateMultipleAssetDto,
  ) {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const assets = [];

      for (let i = 0; i < files.length; i++) {
        const assetMetadata = dto.assets[i];
        if (!assetMetadata.tags.length || !assetMetadata.category) {
          throw new BadRequestException(
            'Asset must have tags and category before uploading',
          );
        }

        let category: Category;
        try {
          category = await this.categoryRepository.findOneByOrFail({
            id: assetMetadata.category,
          });
        } catch (error) {
          throw new NotFoundException('Category not found');
        }
        const name = `${assetMetadata.name}${path.extname(files[i].originalname).toLowerCase()}`;
        const uploadedFile = await this.storage.upload(files[i], name);

        const asset = new Asset();
        asset.name = name;
        asset.type = files[i].mimetype;
        asset.createdBy = user;
        asset.url = uploadedFile;
        asset.category = category;
        asset.tags = await this.tagRepository.findOrCreateMany(
          assetMetadata.tags,
        );

        const assetVersion = new AssetVersion();
        assetVersion.path = uploadedFile;
        assetVersion.url = uploadedFile;
        const savedAsset = await queryRunner.manager.save(Asset, asset);
        assets.push(savedAsset);
        assetVersion.assetId = savedAsset.id;

        await queryRunner.manager.save(AssetVersion, assetVersion);
      }
      await queryRunner.commitTransaction();
      return assets;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(error.message, error.status);
    } finally {
      await queryRunner.release();
    }
  }

  async findAssetOrFail(id: string) {
    let asset: Asset;
    try {
      asset = await this.findOneOrFail({
        where: {
          id,
        },
        relations: [
          'versions',
          'downloads',
          'tags',
          'users',
          'teams',
          'category',
        ],
      });
    } catch (error) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async findAll(filter: { limit: number; page: number; user: User }) {
    const queryOptions: any = {
      order: { createdAt: 'DESC' },
      take: filter.limit,
      skip: filter.limit * ((filter.page ?? 1) - 1),
    };

    if (![Role.admin, Role.staff].includes(filter.user.role)) {
      queryOptions.where = { isPublished: true };
    }
    return await this.find(queryOptions);
  }
}
