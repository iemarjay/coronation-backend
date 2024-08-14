import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { AssetDownload } from './entities/asset-download.entity';
import { AssetVersion } from './entities/asset-version.entity';
import { Tag } from './entities/tag.entity';
import { Asset } from './entities/asset.entity';
import { TagRepository } from './repositories/tag.repository';
import { AssetController } from './controllers/asset.controller';
import { UserModule } from 'src/user/user.module';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { AssetRepository } from './repositories/asset.repository';
import { CategoryService } from './category.service';
import { AccessRequest } from './entities/access-request.entity';
import { AccessRequestRepository } from './repositories/access-request.repository';
import { CategoryController } from './controllers/category.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetDownload,
      AssetVersion,
      Tag,
      Category,
      AccessRequest,
    ]),
    SharedModule,
    UserModule,
  ],
  controllers: [AssetController, CategoryController],
  providers: [
    AssetService,
    TagRepository,
    CategoryRepository,
    AssetRepository,
    CategoryService,
    AccessRequestRepository,
  ],
})
export class AssetModule {}
