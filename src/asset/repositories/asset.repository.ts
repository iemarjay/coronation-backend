import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import { Role, Status } from 'src/user/types';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { StorageService } from 'src/shared/storage.service';
import { AssetTypeRepository } from './asset-type.repository';
import { AssetVersion } from '../entities/asset-version.entity';
import { Subcategory } from '../entities/subcategory.entity';
import { Category } from '../entities/category.entity';
import { TeamRepository } from 'src/team/repositories/team.repository';
import { Team } from 'src/team/entities/team.entity';
import { UserRepository } from 'src/user/repositories/user.repository';
import { UpdateAssetDto } from '../dto/update-asset.dto';

@Injectable()
export class AssetRepository extends Repository<Asset> {
  constructor(
    private readonly datasource: DataSource,
    private readonly storage: StorageService,
    private teamRepository: TeamRepository,
    private assetTypeRepository: AssetTypeRepository,
    private userRepository: UserRepository,
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
        teams = await this.teamRepository.find({
          where: { id: In(dto.teams) },
        });
      }

      if (dto?.users) {
        users = await this.userRepository.find({
          where: { id: In(dto.users) },
        });
      }

      const filename = `${dto.name.toLowerCase().replaceAll(' ', '-')}${path.extname(file.originalname).toLowerCase()}`;
      uploadedFile = await this.storage.upload(file, filename);

      const asset = this.create({
        name: dto.name,
        filename,
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
        console.log(error);
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

      console.log(dto);

      if (!asset) {
        throw new BadRequestException('Asset not found');
      }

      if (!asset.assetType.categories.length && dto.category) {
        throw new BadRequestException(
          'Category is not applicable for this asset type.',
        );
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
      console.log(asset.category);

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
        teams = await this.teamRepository.find({
          where: { id: In(dto.teams) },
        });
        asset.teams = teams;
      }

      if (dto?.users) {
        users = await this.userRepository.find({
          where: { id: In(dto.users) },
        });
        asset.users;
      }

      if (dto.name) {
        asset.name = dto.name;
      }

      if (file) {
        await this.storage.deleteFile(asset.filename);
        const filename = `${dto.name.toLowerCase().replaceAll(' ', '-')}${path.extname(file.originalname).toLowerCase()}`;
        uploadedFile = await this.storage.upload(file, filename);
        asset.filename = filename;
        asset.type = file.mimetype;
        asset.size = file.size;
        asset.lastModifiedBy = user;
        asset.url = uploadedFile;
      }

      const assetVersion = new AssetVersion();
      assetVersion.path = file ? uploadedFile : asset.url;
      assetVersion.url = file ? uploadedFile : asset.url;
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
    date?: Date;
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

    if (filter.date) {
      query.andWhere('CONVERT(date,asset.createdAt) = :date', {
        date: filter.date,
      });
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
