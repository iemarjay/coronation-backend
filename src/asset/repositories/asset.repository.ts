import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import { Role, Status } from 'src/user/types';
import { AssetSourceType, CreateAssetDto } from '../dto/create-asset.dto';
import { StorageService } from 'src/shared/storage.service';
import { AssetTypeRepository } from './asset-type.repository';
import { AssetVersion } from '../entities/asset-version.entity';
import { Subcategory } from '../entities/subcategory.entity';
import { Category } from '../entities/category.entity';
import { TeamRepository } from 'src/team/repositories/team.repository';
import { Team } from 'src/team/entities/team.entity';
import { UserRepository } from 'src/user/repositories/user.repository';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { AccessRequestRepository } from './access-request.repository';

@Injectable()
export class AssetRepository extends Repository<Asset> {
  private readonly logger = new Logger(AssetRepository.name);
  constructor(
    private readonly datasource: DataSource,
    private readonly storage: StorageService,
    private teamRepository: TeamRepository,
    private assetTypeRepository: AssetTypeRepository,
    private userRepository: UserRepository,
    private accessRequestRepository: AccessRequestRepository,
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
    let teams: Team[] | [] = [];
    let users: User[] | [] = [];
    try {
      const assetType = await this.assetTypeRepository.findOne({
        where: {
          name: dto.type.toLowerCase(),
        },
        relations: ['categories', 'categories.subcategories'],
      });
      if (!assetType) {
        throw new BadRequestException('Asset type not found');
      }

      if (
        assetType.name === 'videos' &&
        dto.sourceType === AssetSourceType.File
      ) {
        const videoMimeRegex = /^video\/(mp4|mpeg|avi|mkv)$/;

        if (!videoMimeRegex.test(file.mimetype)) {
          throw new BadRequestException('Only video files are allowed');
        }
      } else if (
        (assetType.name === 'stationery' || assetType.name === 'pitchbooks') &&
        dto.sourceType === AssetSourceType.File
      ) {
        const allowedMimeRegex =
          /^(application\/(msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|pdf|vnd\.ms-powerpoint|vnd\.ms-powerpoint\.presentation\.macroenabled\.12|vnd\.openxmlformats-officedocument\.presentationml\.slide|vnd\.openxmlformats-officedocument\.presentationml\.slideshow|vnd\.openxmlformats-officedocument\.presentationml\.template|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|text\/plain|image\/(jpeg|png|jpg|gif|bmp|webp))$/;

        if (!allowedMimeRegex.test(file.mimetype)) {
          throw new BadRequestException(
            'Only document, powerpoint, or image files are allowed',
          );
        }
      } else if (
        assetType.name === 'logos' &&
        dto.sourceType === AssetSourceType.File
      ) {
        const allowedMimeRegex =
          /^(video\/(mp4|mpeg|avi|mkv)|application\/pdf|image\/(jpeg|png|jpg|gif|bmp|webp))$/;

        if (!allowedMimeRegex.test(file.mimetype)) {
          throw new BadRequestException(
            'Only pdf, video or image files are allowed',
          );
        }
      } else if (
        assetType.name === 'awards' &&
        dto.sourceType === AssetSourceType.File
      ) {
        const allowedMimeRegex =
          /^(image\/(jpeg|png|jpg|gif|bmp|webp)|application\/(msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|pdf|x-coreldraw|photoshop|vnd\.adobe\.photoshop))$/;

        if (!allowedMimeRegex.test(file.mimetype)) {
          throw new BadRequestException(
            'Only image, document, CorelDRAW, or Photoshop files are allowed',
          );
        }
      } else if (
        (assetType.name === 'photographs' ||
          assetType.name === 'illustrations') &&
        dto.sourceType === AssetSourceType.File
      ) {
        const imageMimeRegex = /^image\/(jpeg|png|jpg|gif|webp)$/;

        if (!imageMimeRegex.test(file.mimetype)) {
          throw new BadRequestException('Only image files are allowed');
        }
      } else {
        const generalMimeRegex =
          /^(video\/(mp4|mpeg|avi|mkv)|image\/(jpeg|png|jpg|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))|text\/plain)$/;

        if (
          dto.sourceType === AssetSourceType.File &&
          !generalMimeRegex.test(file.mimetype)
        ) {
          throw new BadRequestException('File type is not supported');
        }
      }

      if (assetType?.categories.length && !dto.category) {
        throw new BadRequestException('Category is required.');
      } else if (!assetType.categories.length && dto.category) {
        throw new BadRequestException('Category is not applicable.');
      } else if (dto.category) {
        category = assetType.categories.find(
          (item) => item.name === dto.category.toLowerCase(),
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
          (s) => s.name === dto.subcategory.toLowerCase(),
        );
        if (!subcategory) {
          throw new BadRequestException(
            'Provided subcategory does not exist within this asset type.',
          );
        }
      }

      if (dto?.teams) {
        const teamsArray = Array.isArray(dto.teams) ? dto.teams : [dto.teams];
        if (dto.teams.includes('All Departments')) {
          teams = await this.teamRepository.find();
        } else {
          teams = await this.teamRepository.find({
            where: { id: In(teamsArray) },
          });
        }
      }

      if (dto?.users) {
        const usersArray = Array.isArray(dto.users) ? dto.users : [dto.users];

        users = await this.userRepository.find({
          where: { id: In(usersArray) },
        });
      }
      let filename = '';
      let type = '';
      let size = 0;
      let url = '';
      if (dto.sourceType === AssetSourceType.File) {
        filename = `${dto.name.toLowerCase().replaceAll(' ', '-')}${path.extname(file.originalname).toLowerCase()}`;
        uploadedFile = await this.storage.upload(file, filename);
        if (file.mimetype.includes('application')) {
          file.mimetype = path
            .extname(file.originalname)
            .toLowerCase()
            .substring(1);
        }
        type = file.mimetype === 'image/svg+xml' ? 'image/svg' : file.mimetype;
        size = file.size;
        url = uploadedFile;
      } else {
        url = dto.fileUrl;
        filename = dto.name;
      }

      const asset = this.create({
        name: dto.name,
        filename,
        type,
        size,
        createdBy: user,
        lastModifiedBy: user,
        url,
        assetType,
        sourceType: dto.sourceType,
      });

      const assetVersion = new AssetVersion();
      assetVersion.path = url;
      assetVersion.url = url;
      assetVersion.asset = asset;

      if (dto.category) {
        asset.category = category;
      }
      if (dto.subcategory) {
        asset.subcategory = subcategory;
      }

      if (dto?.teams) {
        asset.teams = teams;
      }

      if (dto?.users) {
        asset.users = users;
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
        this.logger.error(error);
        throw new InternalServerErrorException('Failed to upload asset');
      }
    }
  }

  async updateAsset(
    user: User,
    id: string,
    file: Express.Multer.File,
    dto: UpdateAssetDto,
  ) {
    let uploadedFile: string | null = null;
    let category: Category | null = null;
    let subcategory: Subcategory | null = null;
    let teams: Team[] | [] = [];
    let users: User[] | [] = [];
    try {
      const asset = await this.findOne({
        where: {
          id,
        },
        relations: [
          'assetType.categories',
          'assetType.categories.subcategories',
          'category.subcategories',
          'versions',
        ],
      });

      if (!asset) {
        throw new BadRequestException('Asset not found');
      }

      if (asset.assetType.name === 'videos' && file) {
        const videoMimeRegex = /^video\/(mp4|mpeg|avi|mkv)$/;

        if (!videoMimeRegex.test(file.mimetype)) {
          throw new BadRequestException('Only video files are allowed');
        }
      } else if (
        (asset.assetType.name === 'stationery' ||
          asset.assetType.name === 'pitchbooks') &&
        file
      ) {
        const allowedMimeRegex =
          /^(application\/(msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|pdf)|text\/plain|image\/(jpeg|png|jpg|gif|bmp|webp))$/;

        if (!allowedMimeRegex.test(file.mimetype)) {
          throw new BadRequestException(
            'Only document or image files asre allowed',
          );
        }
      } else if (asset.assetType.name === 'logos' && file) {
        const allowedMimeRegex =
          /^(video\/(mp4|mpeg|avi|mkv)|application\/pdf|image\/(jpeg|png|jpg|gif|bmp|webp))$/;

        if (!allowedMimeRegex.test(file.mimetype)) {
          throw new BadRequestException(
            'Only pdf, video or image files are allowed',
          );
        }
      } else if (
        (asset.assetType.name === 'photographs' ||
          asset.assetType.name === 'illustrations') &&
        file
      ) {
        const imageMimeRegex = /^image\/(jpeg|png|jpg|gif|webp)$/;

        if (!imageMimeRegex.test(file.mimetype)) {
          throw new BadRequestException('Only image files are allowed');
        }
      } else {
        const generalMimeRegex =
          /^(video\/(mp4|mpeg|avi|mkv)|image\/(jpeg|png|jpg|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))|text\/plain)$/;

        if (file && !generalMimeRegex.test(file.mimetype)) {
          throw new BadRequestException('File type is not supported');
        }
      }

      if (!asset.assetType.categories.length && dto.category) {
        throw new BadRequestException('Category is not applicable.');
      } else if (dto.category) {
        category = asset.assetType.categories.find(
          (item) => item.name === dto.category.toLowerCase(),
        );
        if (!category) {
          throw new BadRequestException(
            'Provided category does not exist within this asset type.',
          );
        }

        asset.category = category;
      }

      if (category?.subcategories.length && !dto.subcategory) {
        throw new BadRequestException(
          `Subcategory is required for ${category.name} category`,
        );
      }

      if (dto.subcategory && category.subcategories?.length) {
        subcategory = category.subcategories.find(
          (s) => s.name === dto.subcategory.toLowerCase(),
        );
        if (!subcategory) {
          throw new BadRequestException(
            'Provided subcategory does not exist within this asset type.',
          );
        }

        asset.subcategory = subcategory;
      }

      if (dto?.teams) {
        const teamsArray = Array.isArray(dto.teams) ? dto.teams : [dto.teams];
        if (dto.teams.includes('All Departments')) {
          teams = await this.teamRepository.find();
        } else {
          teams = await this.teamRepository.find({
            where: { id: In(teamsArray) },
          });
        }
        asset.teams = teams;
      } else {
        asset.teams = [];
      }

      if (dto?.users) {
        const usersArray = Array.isArray(dto.users) ? dto.users : [dto.users];
        users = await this.userRepository.find({
          where: { id: In(usersArray) },
        });
        asset.users = users;
      } else {
        asset.users = [];
      }

      if (dto.name) {
        asset.name = dto.name;
      }

      let filename = asset.filename;
      let type = asset.type;
      let size = asset.size;
      let url = asset.url;
      if (file) {
        filename = asset.filename
          ? `${asset.filename.toLowerCase().replaceAll(' ', '-')}${path.extname(file.originalname).toLowerCase()}`
          : `${dto.name.toLowerCase().replaceAll(' ', '-')}${path.extname(file.originalname).toLowerCase()}`;
        uploadedFile = await this.storage.upload(file, filename);
        if (file.mimetype.includes('application')) {
          file.mimetype = path
            .extname(file.originalname)
            .toLowerCase()
            .substring(1);
        }
        type = file.mimetype === 'image/svg+xml' ? 'image/svg' : file.mimetype;
        size = file.size;
        url = uploadedFile;
      } else if (dto.fileUrl) {
        url = dto.fileUrl;
        filename = dto.name;
        type = '';
        size = 0;
      }

      asset.filename = filename;
      asset.type = type;
      asset.size = size;
      asset.lastModifiedBy = user;
      asset.url = url;

      const assetVersion = new AssetVersion();
      assetVersion.path = url;
      assetVersion.url = url;
      assetVersion.asset = asset;

      asset.versions.push(assetVersion);
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
        relations: [
          'versions',
          'downloads',
          'users',
          'teams',
          'createdBy',
          'lastModifiedBy',
        ],
      });
    } catch (error) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async findAssetById(id: string) {
    let asset: Asset;
    try {
      asset = await this.findOne({
        where: {
          id,
        },
        relations: [
          'versions',
          'downloads',
          'users',
          'teams',
          'createdBy',
          'lastModifiedBy',
        ],
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
    date?: Date;
    category?: string;
    context?: string;
    subcategory?: string;
  }) {
    const query = this.createQueryBuilder('asset');

    // Pagination and Basic Joins
    query
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1))
      .orderBy('asset.createdAt', 'DESC')
      .leftJoinAndSelect('asset.versions', 'versions')
      .leftJoinAndSelect('asset.users', 'users')
      .leftJoinAndSelect('asset.teams', 'teams')
      .leftJoinAndSelect('asset.assetType', 'assetType')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.subcategory', 'subcategory')
      .leftJoinAndSelect('asset.createdBy', 'createdBy')
      .leftJoinAndSelect('asset.lastModifiedBy', 'lastModifiedBy')
      .andWhere('assetType.name = :type', { type: filter.type });

    // Optional Filters
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

    if (filter.date) {
      query.andWhere('CONVERT(date, asset.createdAt) = :date', {
        date: filter.date,
      });
    }

    // Download Context: Only Active Assets
    if (filter.context === 'download') {
      query.andWhere('asset.status = :status', { status: Status.active });
    }

    // Non-Admin User Access Control
    if (filter.user.role !== Role.admin && filter.context !== 'download') {
      const userAccessAssets =
        await this.accessRequestRepository.findAllAcceptedRequestUserAndAssetId(
          filter.user,
        );
      const userAccessAssetIds = userAccessAssets.map(
        (access) => access.asset.id,
      );

      query.andWhere(
        new Brackets((qb) => {
          qb
            // Assets created by the user
            .where('createdBy.id = :userId', { userId: filter.user.id })
            // Or active assets with associations
            .orWhere(
              new Brackets((activeQb) => {
                activeQb
                  .where('asset.status = :activeStatus', {
                    activeStatus: Status.active,
                  })
                  .andWhere(
                    new Brackets((associationQb) => {
                      associationQb
                        .where('users.id = :userId', { userId: filter.user.id })
                        .orWhere('teams.id = :teamId', {
                          teamId: filter.user.team?.id,
                        })
                        .orWhere('asset.id IN (:...authorizedAssetIds)', {
                          authorizedAssetIds: userAccessAssetIds.length
                            ? userAccessAssetIds
                            : [null],
                        });
                    }),
                  );
              }),
            );
        }),
      );
    }

    // Execute query
    const [assets, totalCount] = await query.getManyAndCount();

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount,
      totalPages: Math.ceil(totalCount / filter.limit),
      assets,
    };
  }
}
