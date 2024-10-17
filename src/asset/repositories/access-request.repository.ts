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

  async getAllAccessRequest(filter: {
    limit: number;
    page: number;
    status?: AccessRequestStatus;
    user?: string;
    date?: string;
  }) {
    const queryBuilder = this.createQueryBuilder('accessRequest')
      .leftJoinAndSelect('accessRequest.user', 'user')
      .orderBy('accessRequest.createdAt', 'DESC')
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1));

    if (filter.status) {
      queryBuilder.andWhere('accessRequest.status = :status', {
        status: filter.status,
      });
    }

    if (filter.user) {
      queryBuilder.andWhere('user.id = :userId', { userId: filter.user });
    }

    if (filter.date) {
      queryBuilder.andWhere('CONVERT(date,accessRequest.createdAt) = :date', {
        date: filter.date,
      });
    }

    const [requests, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / filter.limit);

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount: totalCount,
      totalPages: totalPages,
      requests,
    };
  }
}
