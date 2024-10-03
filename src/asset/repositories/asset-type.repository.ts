import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AssetType } from '../entities/asset-type.entity';

@Injectable()
export class AssetTypeRepository extends Repository<AssetType> {
  constructor(private datasource: DataSource) {
    super(AssetType, datasource.createEntityManager());
  }
}
