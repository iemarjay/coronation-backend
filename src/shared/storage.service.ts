import {
  BlobServiceClient,
  ContainerClient,
  BlobDeleteResponse,
} from '@azure/storage-blob';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private client: ContainerClient;

  constructor(private config: ConfigService) {
    const connectionString = this.config.get('azure.connection_string');
    const containerName = this.config.get('azure.container_name');

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.client = blobServiceClient.getContainerClient(containerName);
  }

  async upload(file: Express.Multer.File, name: string): Promise<string> {
    const blobName = name;
    const blockBlobClient = this.client.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size);
    return blockBlobClient.url;
  }

  async download(fileName: string) {
    const blobClient = this.client.getBlobClient(fileName);
    const response = await blobClient.download();
    return response;
  }

  async deleteFile(fileName: string): Promise<BlobDeleteResponse> {
    const blobClient = this.client.getBlobClient(fileName);
    const deleteResponse = await blobClient.delete();

    return deleteResponse;
  }
}
