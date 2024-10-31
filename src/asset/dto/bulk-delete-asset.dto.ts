import { PickType } from '@nestjs/mapped-types';
import { ChangeBulkAssetStatusDto } from './bulk-change-asset-status.dto';

export class DeleteBulkAssetDto extends PickType(ChangeBulkAssetStatusDto, [
  'assetIds',
] as const) {}
