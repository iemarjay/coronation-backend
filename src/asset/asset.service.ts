import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Asset } from './entities/asset.entity';
import { AssetRepository } from './repositories/asset.repository';
import { AccessRequestStatus } from './types';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { Role, Status } from 'src/user/types';
import { AssetDownloadRepository } from './repositories/access-download.repository';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ChangeAssetStatusDto } from './dto/change-asset-status.dto';
import { UserRepository } from 'src/user/repositories/user.repository';
import { FindAllQueryDto } from './dto/find-all-asset.dto';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessRequestedEvent, AssetEvents } from './events/asset.event';

@Injectable()
export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private accessRequestRepository: AccessRequestRepository,
    private assetDownloadRepository: AssetDownloadRepository,
    private permissionRepository: UserRepository,
    private readonly event: EventEmitter2,
  ) {}

  async create(user: User, file: Express.Multer.File, dto: CreateAssetDto) {
    await this.getUserPermission(user, 'upload');
    if (!file) {
      throw new BadRequestException('File missing');
    }
    const assets = await this.assetRepository.createAsset(user, file, dto);
    return assets;
  }

  async downloadAsset(user: User, id: string, res) {
    const asset = await this.assetRepository.findAssetOrFail(id);

    await this.getUserAccess(user, asset, 'download');

    await this.assetDownloadRepository.save({
      asset,
      user,
    });
    return res.redirect(asset.url);
  }

  async getAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    await this.getUserAccess(user, asset, 'read');
    return asset;
  }

  async deleteAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    await this.getUserAccess(user, asset, 'write');
    await this.assetRepository.remove(asset);
    return {
      success: true,
      message: 'Asset deleted',
    };
  }

  async getAllAssets(filter: FindAllQueryDto, user: User) {
    return await this.assetRepository.findAll({
      limit: filter.limit ?? 10,
      page: filter.page ?? 1,
      user,
      search: filter.search,
      type: filter.type,
      category: filter.category,
      subcategory: filter.subcategory,
      date: filter.date,
    });
  }

  async changeStatus(dto: ChangeAssetStatusDto, user: User) {
    await this.getUserPermission(user, 'write');
    const asset = await this.assetRepository.findAssetOrFail(dto.id);

    asset.status = dto.status;
    return this.assetRepository.save(asset);
  }

  async requestAccess(user: User, dto: CreateAccessRequestDto) {
    const asset = await this.assetRepository.findAssetOrFail(dto.assetId);

    if (user.role === 'admin') {
      throw new ForbiddenException('You already have access to all assets');
    }

    const existingRequest =
      await this.accessRequestRepository.findByUserAndAssetId(user, asset);

    if (existingRequest) {
      throw new ForbiddenException('Access request already submitted');
    }

    const request = await this.accessRequestRepository.save({
      user,
      asset,
      message: dto.message,
    });

    this.event.emit(
      AssetEvents.ACCESS_REQUESTED,
      new AccessRequestedEvent(request),
    );

    return {
      message: `Request for access to ${asset.name} sent`,
    };
  }

  async getAllAccessRequest({
    limit,
    page,
    status,
    user,
    date,
  }: {
    limit: number;
    page: number;
    status: AccessRequestStatus;
    user: string;
    date: string;
  }) {
    return await this.accessRequestRepository.getAllAccessRequest({
      limit: limit ?? 10,
      page: page ?? 1,
      status: status,
      user,
      date,
    });
  }

  async updateAccessStatus(id: string, status: AccessRequestStatus) {
    let request = await this.accessRequestRepository.findOne({
      where: {
        id,
      },
      relations: ['user'],
    });
    request.status = status;
    request = await this.accessRequestRepository.save(request);

    this.event.emit(
      AssetEvents.ACCESS_UPDATED,
      new AccessRequestedEvent(request),
    );

    return {
      success: true,
      message: `Access updated to ${status} for user: ${request.user.email}`,
    };
  }

  async getUserAccess(user: User, asset: Asset, accessType: string) {
    const userAccess = await this.accessRequestRepository.findByUserAndAssetId(
      user,
      asset,
    );
    await this.getUserPermission(user, accessType);
    if (user.role === Role.admin) {
      return;
    } else if (asset.status === Status.inactive && accessType !== 'write') {
      throw new UnauthorizedException('Asset has not been published');
    } else if (asset.teams.includes(user.team)) {
      return;
    } else if (asset.users.includes(user)) {
      return;
    } else if (
      !userAccess ||
      userAccess.status !== AccessRequestStatus.approved
    ) {
      throw new UnauthorizedException(
        'You do not have access to view this asset',
      );
    }

    return;
  }

  async getUserPermission(user: User, accessType: string) {
    const hasPermission = await this.permissionRepository.findOne({
      where: {
        id: user.id,
        permissions: {
          name: accessType,
        },
      },
    });
    if (!hasPermission) {
      const errorMessage = this.getUnauthorizedMessage(accessType);
      throw new UnauthorizedException(errorMessage);
    }

    return;
  }

  getUnauthorizedMessage(accessType: string): string {
    switch (accessType) {
      case 'read':
        return 'You do not have permission to view this asset. Please request access from the admin.';
      case 'write':
        return 'You do not have permission to edit or delete this asset. Only authorized team members can make changes.';
      case 'upload':
        return 'You do not have permission to upload asset. Please request access from the admin.';
      case 'download':
        return 'You do not have permission to download this asset. Please request access from the admin.';
      default:
        return `You do not have permission to perform this action on the asset. If you believe this is an error, please contact support.`;
    }
  }
}
