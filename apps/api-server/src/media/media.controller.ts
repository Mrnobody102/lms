import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@repo/database';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

import { IsString, IsNotEmpty, IsNumber, Matches, Max, MaxLength, Min } from 'class-validator';

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const SUPPORTED_UPLOAD_MIME_REGEX =
  /^(image|audio|video)\/[a-z0-9.+-]+$|^application\/(pdf|json)$|^text\/csv$|^application\/vnd\.(ms-excel|openxmlformats-officedocument\.spreadsheetml\.sheet)$/i;

class CreatePresignedUrlDto {
  @ApiProperty({ description: 'The name of the file' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ description: 'The MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(SUPPORTED_UPLOAD_MIME_REGEX, {
    message: 'Unsupported file type',
  })
  mimeType: string;

  @ApiProperty({ description: 'The size of the file in bytes' })
  @IsNumber()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES, { message: 'File is too large' })
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
