import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMultipleAssetDto } from './dto/create-asset.dto';
import { StorageService } from 'src/shared/storage.service';
import { User } from 'src/user/entities/user.entity';
import { EntityManager } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { AssetVersion } from './entities/asset-version.entity';
import { TagRepository } from './repositories/tag.repository';
import { AssetRepository } from './repositories/asset.repository';
import { CategoryRepository } from './repositories/category.repository';
import { AccessRequestStatus, AccessType } from './types';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { Role } from 'src/user/types';

@Injectable()
export class AssetService {
  constructor(
    private storage: StorageService,
    private entityManager: EntityManager,
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private accessRequestRepository: AccessRequestRepository,
  ) {}
  async create(
    user: User,
    files: Express.Multer.File[],
    dto: CreateMultipleAssetDto,
  ) {
    if (dto.assets.length !== files.length) {
      throw new BadRequestException(
        'Number of files does not match number of assets',
      );
    }

    const uploadedAssets = await this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const assets = [];

        for (let i = 0; i < files.length; i++) {
          const assetMetadata = dto.assets[i];
          if (!assetMetadata.tags.length || !assetMetadata.category) {
            throw new BadRequestException(
              'Asset must have tags and category before uploading',
            );
          }
          const uploadedFile = await this.storage.upload(
            files[i],
            assetMetadata.name,
          );

          const asset = new Asset();
          asset.name = assetMetadata.name;
          asset.type = files[i].mimetype;
          asset.createdBy = user;

          const assetVersion = new AssetVersion();
          assetVersion.path = uploadedFile;
          assetVersion.url = uploadedFile;
          asset.versions = [assetVersion];

          asset.tags = await this.tagRepository.findOrCreateMany(
            assetMetadata.tags,
          );

          asset.category = await this.categoryRepository.findOneByOrFail({
            id: assetMetadata.category,
          });

          assets.push(await transactionalEntityManager.save(Asset, asset));
        }

        return assets;
      },
    );

    return uploadedAssets;
  }

  async getAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    if (!asset.isPublished) {
      throw new UnauthorizedException('Asset has not been published');
    } else if (
      asset.type === AccessType.public ||
      [Role.admin, Role.staff].includes(user.role)
    ) {
      return asset;
    } else if (asset.teams.includes(user.team)) {
      return asset;
    }
    const userAccess = await this.accessRequestRepository.findByUserAndAssetId(
      user,
      id,
    );
    if (!userAccess || userAccess.status !== AccessRequestStatus.approved) {
      throw new UnauthorizedException(
        'You do not have access to view this asset',
      );
    }
    return userAccess.asset;
  }

  async getAllAssets({
    limit,
    page,
    user,
  }: {
    limit: number;
    page: number;
    user: User;
  }) {
    return await this.assetRepository.findAll({
      limit: limit ?? 10,
      page: page ?? 1,
      user,
    });
  }

  async publish(id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);

    asset.isPublished = true;
    return this.assetRepository.save(asset);
  }

  async requestAccess(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    if (asset.type === AccessType.public) {
      throw new ForbiddenException(
        'Access request not needed for public assets',
      );
    }

    if (user.role === 'admin' || user.role === 'staff') {
      throw new ForbiddenException('You already have access to all assets');
    }

    const existingRequest =
      await this.accessRequestRepository.findByUserAndAsset(user, asset);

    if (existingRequest) {
      throw new ForbiddenException('Access request already submitted');
    }

    return await this.accessRequestRepository.save({
      user,
      asset,
      status: AccessRequestStatus.pending,
    });
  }
}
