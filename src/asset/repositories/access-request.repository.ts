import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
import { AccessRequest } from '../entities/access-request.entity';
import { User } from 'src/user/entities/user.entity';
import { Asset } from '../entities/asset.entity';
import { AccessRequestStatus } from '../types';

@Injectable()
export class AccessRequestRepository extends Repository<AccessRequest> {
  constructor(private datasource: DataSource) {
    super(AccessRequest, datasource.createEntityManager());
  }

  async findByUserId(
    id: string,
    filter: { limit: number; page: number; status?: AccessRequestStatus },
  ) {
    const queryOptions: FindManyOptions = {
      where: {
        user: { id },
      },
      order: { updatedAt: 'DESC' },
      take: filter.limit,
      skip: filter.limit * ((filter.page ?? 1) - 1),
      relations: ['user'],
    };

    if (filter.status) {
      queryOptions.where = {
        ...queryOptions.where,
        status: filter.status,
      };
    }

    return this.find(queryOptions);
  }

  async findByUserAndAsset(user: User, asset: Asset) {
    return this.findOne({
      where: {
        user: {
          id: user.id,
        },
        asset: {
          id: asset.id,
        },
      },
      relations: ['asset'],
    });
  }

  async findByUserAndAssetId(user: User, asset: Asset) {
    return this.findOne({
      relations: ['asset', 'user'],
      where: {
        user: { id: user.id },
        asset: {
          id: asset.id,
        },
      },
    });
  }

  getAllAccessRequest(filter: {
    limit: number;
    page: number;
    status?: AccessRequestStatus;
  }) {
    const queryOptions: FindManyOptions = {
      order: { updatedAt: 'DESC' },
      take: filter.limit,
      skip: filter.limit * ((filter.page ?? 1) - 1),
      relations: ['user'],
    };

    if (filter.status) {
      queryOptions.where = { status: filter.status };
    }

    return this.find(queryOptions);
  }
}
