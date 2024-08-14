import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/types';

@Injectable()
export class AssetRepository extends Repository<Asset> {
  constructor(private datasource: DataSource) {
    super(Asset, datasource.createEntityManager());
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
