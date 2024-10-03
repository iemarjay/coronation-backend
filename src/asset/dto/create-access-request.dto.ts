import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'message is required' })
  message: string;

  @IsString()
  @IsNotEmpty({ message: 'assetId is required' })
  assetId: string;
}
