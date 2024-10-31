import {
  BlobServiceClient,
  ContainerClient,
  BlobDeleteResponse,
} from '@azure/storage-blob';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private client: ContainerClient;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    const connectionString = this.config.get('azure.connection_string');
    const containerName = this.config.get('azure.container_name');

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.client = blobServiceClient.getContainerClient(containerName);
  }

  async upload(file: Express.Multer.File, name: string): Promise<string> {
    try {
      const blobName = name;
      const blockBlobClient = this.client.getBlockBlobClient(blobName);

      await blockBlobClient.upload(file.buffer, file.size);
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async download(fileName: string) {
    try {
      const blobClient = this.client.getBlobClient(fileName);
      const response = await blobClient.download();
      return response;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async deleteFile(fileName: string): Promise<BlobDeleteResponse> {
    try {
      const blobClient = this.client.getBlobClient(fileName);
      const deleteResponse = await blobClient.delete();

      return deleteResponse;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
