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
  Logger,
  Delete,
  Res,
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
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ChangeRequestStatusDto } from '../dto/change-request-status.dto';
import { Response } from 'express';
import { ChangeBulkAssetStatusDto } from '../dto/bulk-change-asset-status.dto';
import { DeleteBulkAssetDto } from '../dto/bulk-delete-asset.dto';

@Controller('assets')
@UseInterceptors(ClassSerializerInterceptor)
export class AssetController {
  private readonly logger = new Logger(AssetController.name);
  constructor(
    private readonly assetService: AssetService,
    private readonly assetTypeService: AssetTypeService,
  ) {}

  @Authenticate(Role.admin)
  @UseInterceptors(FileInterceptor('file'))
  @Post('add')
  create(
    @Body() dto: CreateAssetDto,
    @AuthUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assetService.create(user, file, dto);
  }

  @Authenticate(Role.admin)
  @Post('create-type')
  createType(@Body() dto: CreateAssetTypeDto) {
    return this.assetTypeService.createAssetType(dto);
  }

  @Get('types')
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

  @Authenticate(Role.admin)
  @UseInterceptors(FileInterceptor('file'))
  @Patch('update/:id')
  update(
    @AuthUser() user: User,
    @Body() dto: UpdateAssetDto,
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.assetService.update(user, id, file, dto);
  }

  @Authenticate(Role.admin)
  @Delete('/:id')
  delete(@AuthUser() user: User, @Param('id') id: string) {
    return this.assetService.deleteAsset(user, id);
  }

  @Authenticate(Role.admin)
  @Delete('delete/multiple')
  async deleteFiles(@Body() dto: DeleteBulkAssetDto, @AuthUser() user: User) {
    return await this.assetService.deleteAssets(dto, user);
  }

  @Authenticate()
  @Get('download/:id')
  download(
    @AuthUser() user: User,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.assetService.downloadAsset(user, id, res);
  }

  @Authenticate(Role.admin)
  @Patch('change-status')
  toggleActivation(@Body() dto: ChangeAssetStatusDto, @AuthUser() user: User) {
    return this.assetService.changeStatus(dto, user);
  }

  @Authenticate(Role.admin)
  @Patch('change-status/bulk')
  async updateAssetsStatus(
    @Body() dto: ChangeBulkAssetStatusDto,
    @AuthUser() user: User,
  ) {
    return await this.assetService.updateAssetStatus(dto, user);
  }

  @Authenticate(Role.admin)
  @Patch('request/:id')
  updateAccessStatus(
    @Param('id') id: string,
    @AuthUser() user: User,
    @Body() dto: ChangeRequestStatusDto,
  ) {
    return this.assetService.updateAccessStatus(id, dto, user);
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
    @Query('type') type: 'pending' | 'past',
    @Query('status') status: AccessRequestStatus,
    @Query('search') search: string,
    @Query('date') date: string,
    @Query('user') user: string,
  ) {
    return this.assetService.getAllAccessRequest({
      page,
      limit,
      status,
      type,
      user,
      date,
      search,
    });
  }
}
