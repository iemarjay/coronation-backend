import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { AssetDownload } from './entities/asset-download.entity';
import { AssetVersion } from './entities/asset-version.entity';
import { Asset } from './entities/asset.entity';
import { AssetController } from './controllers/asset.controller';
import { UserModule } from 'src/user/user.module';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { AssetRepository } from './repositories/asset.repository';
import { CategoryService } from './category.service';
import { AccessRequest } from './entities/access-request.entity';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { CategoryController } from './controllers/category.controller';
import { AssetDownloadRepository } from './repositories/access-download.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetDownload,
      AssetVersion,
      Category,
      AccessRequest,
    ]),
    SharedModule,
    UserModule,
  ],
  controllers: [AssetController, CategoryController],
  providers: [
    AssetService,
    CategoryRepository,
    AssetRepository,
    CategoryService,
    AccessRequestRepository,
    AssetDownloadRepository,
  ],
})
export class AssetModule {}
