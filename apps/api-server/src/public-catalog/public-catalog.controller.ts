import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAwareRequest } from '../common/utils/tenant-request.util';
import { PublicCourseQueryDto } from './dto/public-course-query.dto';
import { PublicCatalogService } from './public-catalog.service';

@ApiTags('public-courses')
@Controller('public/courses')
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List published courses for a tenant without authentication' })
  listCourses(@Query() query: PublicCourseQueryDto, @Request() req: TenantAwareRequest) {
    return this.publicCatalogService.listCourses(requireTenantId(req), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public marketing details for a published course' })
  getCourse(@Param('id', ParseUUIDPipe) id: string, @Request() req: TenantAwareRequest) {
    return this.publicCatalogService.getCourse(id, requireTenantId(req));
  }
}

function requireTenantId(req: TenantAwareRequest): string {
  if (!req.tenantId) {
    throw new BadRequestException('Tenant context is required');
  }

  return req.tenantId;
}
