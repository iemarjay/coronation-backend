import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Asset } from './entities/asset.entity';
import { AssetRepository } from './repositories/asset.repository';
import { AccessRequestStatus } from './types';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { Role, Status } from 'src/user/types';
import { AssetDownloadRepository } from './repositories/access-download.repository';
import { AssetSourceType, CreateAssetDto } from './dto/create-asset.dto';
import { ChangeAssetStatusDto } from './dto/change-asset-status.dto';
import { UserRepository } from 'src/user/repositories/user.repository';
import { FindAllQueryDto } from './dto/find-all-asset.dto';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccessRequestedEvent, AssetEvents } from './events/asset.event';
import { StorageService } from 'src/shared/storage.service';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ChangeRequestStatusDto } from './dto/change-request-status.dto';
import { ChangeBulkAssetStatusDto } from './dto/bulk-change-asset-status.dto';
import { In } from 'typeorm';
import { DeleteBulkAssetDto } from './dto/bulk-delete-asset.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { Method } from 'src/audit-log/entites/audit-log.entity';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
  constructor(
    private assetRepository: AssetRepository,
    private accessRequestRepository: AccessRequestRepository,
    private assetDownloadRepository: AssetDownloadRepository,
    private permissionRepository: UserRepository,
    private readonly event: EventEmitter2,
    private readonly storage: StorageService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(user: User, file: Express.Multer.File, dto: CreateAssetDto) {
    await this.getUserPermission(user, 'upload');
    if (dto.sourceType === AssetSourceType.File && !file) {
      throw new BadRequestException('File missing');
    } else if (dto.sourceType === AssetSourceType.SharePoint && !dto.fileUrl) {
      throw new BadRequestException('file link missing');
    }
    const assets = await this.assetRepository.createAsset(user, file, dto);
    this.auditLogService.logAction(Method.upload, user, assets.id);
    return {
      success: true,
      message:
        'File uploaded successfully. It will be available once published.',
      data: assets,
    };
  }

  async update(
    user: User,
    id: string,
    file: Express.Multer.File,
    dto: UpdateAssetDto,
  ) {
    await this.getUserPermission(user, 'write');
    const assets = await this.assetRepository.updateAsset(user, id, file, dto);
    this.auditLogService.logAction(Method.update, user, assets.id);
    return {
      success: true,
      message: 'File has been updated successfully.',
      data: assets,
    };
  }

  async downloadAsset(user: User, id: string, res) {
    const asset = await this.assetRepository.findAssetOrFail(id);

    await this.getUserAccess(user, asset, 'download');

    if (!asset.type.length || asset.sourceType === AssetSourceType.SharePoint) {
      return res.redirect(asset.url);
    }

    const response = await this.storage.download(asset.filename);

    res.setHeader('Content-Type', asset.type);
    res.setHeader('Content-Length', response.contentLength);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asset.filename}"`,
    );

    await this.assetDownloadRepository.save({
      asset,
      user,
    });

    response.readableStreamBody.pipe(res);
  }

  async getAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    return asset;
  }

  async deleteAsset(user: User, id: string) {
    const asset = await this.assetRepository.findAssetOrFail(id);
    await this.getUserAccess(user, asset, 'write');
    await this.storage.deleteFile(asset.filename);
    this.auditLogService.logAction(Method.delete, user, asset.id);
    await this.assetRepository.remove(asset);
    return {
      success: true,
      message: 'File deleted. It will be permanently removed from the website',
    };
  }

  async deleteAssets(dto: DeleteBulkAssetDto, user: User) {
    await this.getUserPermission(user, 'write');

    const deletePromises = dto.assetIds.map(async (id) => {
      const asset = await this.assetRepository.findAssetById(id);
      if (asset) {
        await this.storage.deleteFile(asset.filename);
        this.auditLogService.logAction(Method.delete, user, asset.id);
        await this.assetRepository.remove(asset);
      } else {
        this.logger.error(`Asset with id ${id} not found`);
      }
    });

    await Promise.all(deletePromises);
    return {
      success: true,
      message: 'Files deleted. It will be permanently removed from the website',
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
      context: filter.context,
    });
  }

  async getAllDownloads({ limit, page }: { limit: number; page: number }) {
    return await this.assetDownloadRepository.findAll({
      limit: limit ?? 10,
      page: page ?? 1,
    });
  }

  async changeStatus(dto: ChangeAssetStatusDto, user: User) {
    await this.getUserPermission(user, 'write');
    const asset = await this.assetRepository.findAssetOrFail(dto.id);

    asset.status = dto.status;
    const result = await this.assetRepository.save(asset);
    const method =
      dto.status === Status.active ? Method.activate : Method.deactivate;
    this.auditLogService.logAction(method, user, asset.id);
    return {
      success: true,
      message: `File ${dto.status === Status.active ? 'Activated' : 'Deactivated'}`,
      data: result,
    };
  }

  async updateAssetStatus(dto: ChangeBulkAssetStatusDto, user: User) {
    await this.getUserPermission(user, 'write');
    await this.assetRepository.update(
      { id: In(dto.assetIds) },
      { status: dto.status },
    );
    const method =
      dto.status === Status.active ? Method.activate : Method.deactivate;
    for (const assetId of dto.assetIds) {
      const asset = await this.assetRepository.findAssetById(assetId);
      if (asset) {
        this.auditLogService.logAction(method, user, asset.id);
      }
    }

    return {
      success: true,
      message: `Assets ${dto.status === Status.active ? 'Activated' : 'Deactivated'}`,
    };
  }

  async requestAccess(user: User, dto: CreateAccessRequestDto) {
    const asset = await this.assetRepository.findAssetOrFail(dto.assetId);

    if (user.role === 'admin') {
      throw new ForbiddenException('You already have access to all assets');
    }

    const existingRequest =
      await this.accessRequestRepository.findByUserAndAssetId(user, asset);

    if (
      existingRequest &&
      existingRequest.status === AccessRequestStatus.pending
    ) {
      throw new ForbiddenException(
        'Request to access this asset already exists',
      );
    }

    if (
      existingRequest &&
      existingRequest.status === AccessRequestStatus.declined
    ) {
      throw new ForbiddenException(
        'Your request to access this asset has been declined',
      );
    }

    const request = await this.accessRequestRepository.save({
      user,
      asset,
      message: dto.message,
    });

    this.event.emit(
      AssetEvents.ACCESS_REQUESTED,
      new AccessRequestedEvent(request, user),
    );

    return {
      message: `Request for access to ${asset.name} sent`,
    };
  }

  async getAllAccessRequest({
    limit,
    page,
    status,
    type,
    user,
    date,
    search,
  }: {
    limit: number;
    page: number;
    type: 'pending' | 'past';
    status?: AccessRequestStatus;
    user: string;
    date: string;
    search: string;
  }) {
    return await this.accessRequestRepository.getAllAccessRequest({
      limit: limit ?? 10,
      page: page ?? 1,
      status,
      type,
      user,
      date,
      search,
    });
  }

  async updateAccessStatus(
    id: string,
    dto: ChangeRequestStatusDto,
    user: User,
  ) {
    let request = await this.accessRequestRepository.findOne({
      where: {
        id,
      },
      relations: ['user', 'asset.assetType'],
    });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    if (request.status === AccessRequestStatus.declined) {
      throw new BadRequestException('Request has already been declined');
    }

    if (request.status === AccessRequestStatus.accepted) {
      throw new BadRequestException('Request has already been accepted');
    }

    if (dto.status === AccessRequestStatus.declined && !dto.reason) {
      throw new BadRequestException('Reason for rejection is required');
    }

    request.status = dto.status;
    request.updatedBy = user;

    if (dto.reason) request.rejectionReason = dto.reason;
    request = await this.accessRequestRepository.save(request);

    this.event.emit(
      AssetEvents.ACCESS_UPDATED,
      new AccessRequestedEvent(request, user),
    );

    return {
      success: true,
      message: `User's request ${dto.status} successfully`,
    };
  }

  async getUserAccess(user: User, asset: Asset, accessType: string) {
    if (user.role === Role.admin || user.role === Role.staff) {
      return;
    }
    await this.getUserPermission(user, accessType);
    const userAccess =
      await this.accessRequestRepository.findAcceptedRequestUserAndAssetId(
        user,
        asset,
      );

    if (asset.status === Status.inactive && accessType !== 'write') {
      throw new UnauthorizedException('Asset has not been published');
    } else if (
      userAccess &&
      userAccess?.status === AccessRequestStatus.accepted
    ) {
      return;
    } else if (asset.teams.includes(user.team)) {
      return;
    } else if (asset.users.includes(user)) {
      return;
    } else if (!userAccess) {
      const value = {
        read: 'view',
        download: 'download',
      };
      throw new UnauthorizedException(
        `You do not have access to ${value[accessType]} this asset`,
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
    if (user.role === Role.admin || user.role === Role.staff) {
      return;
    }
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
        return 'You do not have permission to edit or delete this asset. Only authorized staff can make changes.';
      case 'upload':
        return 'You do not have permission to upload asset. Please request access from the admin.';
      case 'download':
        return 'You do not have permission to download this asset. Please request access from the admin.';
      default:
        return `You do not have permission to perform this action on the asset. If you believe this is an error, please contact support.`;
    }
  }
}
