import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssetDownload } from '../entities/asset-download.entity';

@Injectable()
export class AssetDownloadRepository extends Repository<AssetDownload> {
  constructor(private datasource: DataSource) {
    super(AssetDownload, datasource.createEntityManager());
  }
}
