import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAwareRequest } from '../common/utils/tenant-request.util';
import { TenantCacheInterceptor } from '../common/interceptors/tenant-cache.interceptor';
import { PublicCourseQueryDto } from './dto/public-course-query.dto';
import { PublicCatalogService } from './public-catalog.service';

@ApiTags('public-courses')
@Controller('public/courses')
@UseInterceptors(TenantCacheInterceptor)
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get()
  @CacheTTL(60000) // 1 minute cache
  @ApiOperation({ summary: 'List published courses for a tenant without authentication' })
  listCourses(@Query() query: PublicCourseQueryDto, @Request() req: TenantAwareRequest) {
    return this.publicCatalogService.listCourses(requireTenantId(req), query);
  }

  @Get(':id')
  @CacheTTL(60000) // 1 minute cache
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
