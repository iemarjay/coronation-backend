import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssetDownload } from '../entities/asset-download.entity';

@Injectable()
export class AssetDownloadRepository extends Repository<AssetDownload> {
  constructor(private datasource: DataSource) {
    super(AssetDownload, datasource.createEntityManager());
  }

  async findAll(filter: { limit: number; page: number }) {
    const query = this.createQueryBuilder('assetDownload');

    // Pagination and Basic Joins
    query
      .take(filter.limit)
      .skip(filter.limit * ((filter.page ?? 1) - 1))
      .orderBy('assetDownload.createdAt', 'DESC')
      .leftJoinAndSelect('assetDownload.asset', 'asset')
      .leftJoinAndSelect('assetDownload.user', 'user');

    // Execute query
    const [downloads, totalCount] = await query.getManyAndCount();

    return {
      currentPage: filter.page,
      pageSize: filter.limit,
      totalCount,
      totalPages: Math.ceil(totalCount / filter.limit),
      downloads,
    };
  }
}
