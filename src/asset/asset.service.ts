import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMultipleAssetDto } from './dto/create-asset.dto';
import { User } from 'src/user/entities/user.entity';
import { Asset } from './entities/asset.entity';
import { AssetRepository } from './repositories/asset.repository';
import { AccessRequestStatus, AccessType } from './types';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { Role } from 'src/user/types';
import { AssetDownloadRepository } from './repositories/access-download.repository';

@Injectable()
export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private accessRequestRepository: AccessRequestRepository,
    private assetDownloadRepository: AssetDownloadRepository,
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
    const assets = await this.assetRepository.createMany(user, files, dto);
    return assets;
  }

  async downloadAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);

    await this.getUserAccess(user, asset);

    await this.assetDownloadRepository.save({
      asset,
      user,
    });
    return { data: asset.url };
  }

  async getAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    await this.getUserAccess(user, asset);
    return asset;
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

    await this.accessRequestRepository.save({
      user,
      asset,
    });

    return {
      message: `Request for access to ${asset.name} sent`,
    };
  }

  async getAllAccessRequest({
    limit,
    page,
    status,
  }: {
    limit: number;
    page: number;
    status: AccessRequestStatus;
  }) {
    return await this.accessRequestRepository.getAllAccessRequest({
      limit: limit ?? 10,
      page: page ?? 1,
      status: status,
    });
  }

  async updateAccessStatus(id: string, status: AccessRequestStatus) {
    const request = await this.accessRequestRepository.findOne({
      where: {
        id,
      },
      relations: ['user'],
    });
    request.status = status;
    await this.accessRequestRepository.save(request);

    return {
      success: true,
      message: `Access updated to ${status} for user: ${request.user.email}`,
    };
  }

  async getAllAccessRequestByUser(
    id: string,
    {
      limit,
      page,
      status,
    }: { limit: number; page: number; status: AccessRequestStatus },
  ) {
    return await this.accessRequestRepository.findByUserId(id, {
      limit: limit ?? 10,
      page: page ?? 1,
      status: status,
    });
  }

  async getUserAccess(user: User, asset: Asset) {
    const userAccess = await this.accessRequestRepository.findByUserAndAssetId(
      user,
      asset,
    );
    if ([Role.admin, Role.staff].includes(user.role)) {
      return true;
    } else if (!asset.isPublished) {
      throw new UnauthorizedException('Asset has not been published');
    } else if (asset.type === AccessType.public) {
      return true;
    } else if (asset.teams.includes(user.team)) {
      return true;
    } else if (
      !userAccess ||
      userAccess.status !== AccessRequestStatus.approved
    ) {
      throw new UnauthorizedException(
        'You do not have access to view this asset',
      );
    }

    return true;
  }
}
