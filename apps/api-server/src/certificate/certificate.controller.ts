import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CertificateService } from './certificate.service';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate eligibility and issued certificate for a course' })
  @ApiResponse({ status: 200, description: 'Certificate status retrieved successfully' })
  getCourseCertificateStatus(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.certificateService.getCourseCertificateStatus(
      courseId,
      getScopedTenantId(req),
      req.user,
    );
  }

  @Post('course/:courseId/issue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a course certificate when progress is complete' })
  @ApiResponse({ status: 201, description: 'Certificate issued successfully' })
  issueCourseCertificate(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.certificateService.issueCourseCertificate(
      courseId,
      getScopedTenantId(req),
      req.user,
    );
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a public course certificate code' })
  @ApiResponse({ status: 200, description: 'Certificate verification retrieved successfully' })
  verifyCertificate(@Param('code') code: string) {
    return this.certificateService.verifyCertificate(code);
  }

  @Get('verify/:code/image')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Render a public course certificate image' })
  @ApiResponse({ status: 200, description: 'Certificate image rendered successfully' })
  renderCertificateImage(@Param('code') code: string) {
    return this.certificateService.buildCertificateImage(code);
  }
}
