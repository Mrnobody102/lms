import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@repo/database';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

class CreatePresignedUrlDto {
  @ApiProperty({ description: 'The name of the file' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'The MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'The size of the file in bytes' })
  @IsNumber()
  @Min(1)
  sizeBytes: number;
}

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Request a S3 presigned URL for upload' })
  @Post('presigned-url')
  async getUploadUrl(
    @CurrentUser() user: { id: string; tenantId: string; role: Role },
    @Body() dto: CreatePresignedUrlDto,
  ) {
    return this.mediaService.createPresignedUrl(
      user.tenantId,
      user.id,
      dto.filename,
      dto.mimeType,
      dto.sizeBytes,
    );
  }

  @ApiOperation({ summary: 'Mark the upload status of a media asset as READY' })
  @Post(':id/complete')
  async completeUpload(@CurrentUser() user: { tenantId: string }, @Param('id') assetId: string) {
    return this.mediaService.markUploadComplete(user.tenantId, assetId);
  }
}
