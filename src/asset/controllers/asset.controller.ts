import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Param,
  Patch,
  Query,
  Get,
  ClassSerializerInterceptor,
  UploadedFile,
} from '@nestjs/common';
import {
  Authenticate,
  AuthUser,
} from 'src/shared/decorators/auth-user.decorator';
import { Role } from 'src/user/types';
import { AssetService } from '../asset.service';
import { User } from 'src/user/entities/user.entity';
import { AccessRequestStatus } from '../types';
import { CreateAssetTypeDto } from '../dto/create-asset-type.dto';
import { AssetTypeService } from '../asset-type.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { ChangeAssetStatusDto } from '../dto/change-asset-status.dto';
import { FindAllQueryDto } from '../dto/find-all-asset.dto';
import { CreateAccessRequestDto } from '../dto/create-access-request.dto';

@Controller('asset')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly assetTypeService: AssetTypeService,
  ) {}

  @Authenticate(Role.admin)
  @UseInterceptors(FileInterceptor('file'))
  @Post('add')
  create(
    @Body('body') jsonData: string,
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const dto: CreateAssetDto = JSON.parse(jsonData);
    return this.assetService.create(user, file, dto);
  }

  // @Authenticate()
  @Post('create-type')
  createType(@Body() dto: CreateAssetTypeDto) {
    return this.assetTypeService.createAssetType(dto);
  }

  @Get('type')
  getTypes() {
    return this.assetTypeService.getAssetTypes();
  }

  @Authenticate()
  @Get()
  getAll(@Query() query: FindAllQueryDto, @AuthUser() user: User) {
    return this.assetService.getAllAssets(query, user);
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
  @Patch('change-status')
  toggleActivation(@Body() dto: ChangeAssetStatusDto, @AuthUser() user: User) {
    return this.assetService.changeStatus(dto, user);
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
  @Post('request')
  request(@AuthUser() user: User, @Body() dto: CreateAccessRequestDto) {
    return this.assetService.requestAccess(user, dto);
  }

  @Authenticate(Role.admin)
  @Get('request/all')
  getAllAccessRequest(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('status') status: AccessRequestStatus,
    @Query('user') user: string,
  ) {
    return this.assetService.getAllAccessRequest({ page, limit, status, user });
  }
}
