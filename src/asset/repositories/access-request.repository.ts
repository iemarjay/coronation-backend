import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AccessRequest } from '../entities/access-request.entity';
import { User } from 'src/user/entities/user.entity';
import { Asset } from '../entities/asset.entity';

@Injectable()
export class AccessRequestRepository extends Repository<AccessRequest> {
  constructor(private datasource: DataSource) {
    super(AccessRequest, datasource.createEntityManager());
  }

  async findByUserAndAsset(user: User, asset: Asset) {
    return this.findOne({
      where: {
        user,
        asset,
      },
      relations: ['asset'],
    });
  }

  async findByUserAndAssetId(user: User, id: string) {
    return this.findOne({
      where: {
        user,
        asset: {
          id,
        },
      },
      relations: ['asset'],
    });
  }
}
