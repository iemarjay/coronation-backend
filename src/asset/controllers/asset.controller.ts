import {
  Controller,
  Post,
  Body,
  Req,
  UseInterceptors,
  UploadedFiles,
  Param,
  Patch,
  Query,
  Get,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  Authenticate,
  AuthUser,
} from 'src/shared/decorators/auth-user.decorator';
import { Role } from 'src/user/types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AssetService } from '../asset.service';
import { CreateMultipleAssetDto } from '../dto/create-asset.dto';
import { User } from 'src/user/entities/user.entity';
import { AccessRequestStatus } from '../types';

@Controller('assets')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Authenticate(Role.admin)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('add')
  create(
    @Body('json') jsonData: string,
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateMultipleAssetDto = JSON.parse(jsonData);
    return this.assetService.create(req.user, files, dto);
  }

  @Authenticate()
  @Get()
  getAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @AuthUser() user: User,
  ) {
    return this.assetService.getAllAssets({ page, limit, user });
  }

  @Authenticate()
  @Get('/:id')
  get(@AuthUser() user: User, @Param('id') id: string) {
    return this.assetService.getAsset(user, id);
  }

  @Authenticate()
  @Get('download/:id')
  download(@AuthUser() user: User, @Param('id') id: string) {
    return this.assetService.downloadAsset(user, id);
  }

  @Authenticate(Role.admin)
  @Patch('publish/:id')
  publish(@Param('id') id: string) {
    return this.assetService.publish(id);
  }

  @Authenticate(Role.admin)
  @Patch('request/:id')
  updateAccessStatus(
    @Param('id') id: string,
    @Body('status') status: AccessRequestStatus,
  ) {
    return this.assetService.updateAccessStatus(id, status);
  }

  @Authenticate(Role.vendor)
  @Post('request/:id')
  request(@AuthUser() user: User, @Param('id') id: string) {
    return this.assetService.requestAccess(user, id);
  }

  @Authenticate(Role.admin)
  @Get('request/all')
  getAllAccessRequest(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: AccessRequestStatus,
  ) {
    return this.assetService.getAllAccessRequest({ page, limit, status });
  }

  @Authenticate(Role.admin)
  @Get('request/user/:id')
  getAllAccessRequestByUser(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: AccessRequestStatus,
  ) {
    return this.assetService.getAllAccessRequestByUser(id, {
      page,
      limit,
      status,
    });
  }
}
