import {
  BlobServiceClient,
  ContainerClient,
  BlobDeleteResponse,
} from '@azure/storage-blob';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private client: ContainerClient;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    const connectionString = this.config.get('azure.storage.connection_string');
    const containerName = this.config.get('azure.storage.container_name');

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.client = blobServiceClient.getContainerClient(containerName);
  }

  async upload(file: Express.Multer.File, name: string): Promise<string> {
    try {
      const blobName = name;
      const blockBlobClient = this.client.getBlockBlobClient(blobName);

      const stream = Readable.from(file.buffer);

      const blockSize = 4 * 1024 * 1024; // 4MB
      const maxConcurrency = 5;

      await blockBlobClient.uploadStream(stream, blockSize, maxConcurrency);

      return blockBlobClient.url;
    } catch (error) {
      this.logger.error('Error uploading file to Azure Blob Storage', error);
      throw error;
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
