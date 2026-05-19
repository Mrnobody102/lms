import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY') || '';
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY') || '';
    this.bucketName = this.configService.get<string>('S3_BUCKET') || 'lms-media';

    // Ensure we only pass credentials if they exist
    const credentials =
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials,
      forcePathStyle: true, // often needed for MinIO/R2
    });

    this.logger.log(`Initialized S3 Storage client for bucket: ${this.bucketName}`);
  }

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const publicUrlBase = this.configService.get<string>('S3_PUBLIC_URL');

    if (publicUrlBase) {
      return `${publicUrlBase}/${key}`;
    }

    if (endpoint) {
      // Assuming path-style access if custom endpoint
      return `${endpoint}/${this.bucketName}/${key}`;
    }

    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}
