import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { CreateMarketplaceUsageEventDto } from './dto/create-marketplace-usage-event.dto';
import { MarketplaceQueryDto } from './dto/marketplace-query.dto';
import { MarketplaceReportQueryDto } from './dto/marketplace-report-query.dto';
import { SignedUrlRequestDto } from './dto/signed-url-request.dto';
import { SubscribeMarketplaceItemDto } from './dto/subscribe-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items')
  @ApiOperation({ summary: 'List published cross-tenant resource packages' })
  listPublished(@Query() query: MarketplaceQueryDto) {
    return this.marketplaceService.listPublished(query);
  }

  @Post('items')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Publish a course or media asset as a marketplace item' })
  createItem(@Body() dto: CreateMarketplaceItemDto, @Request() req: AuthenticatedRequest) {
    return this.marketplaceService.createItem(getScopedTenantId(req), dto);
  }

  @Get('my-items')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List marketplace items owned by the current tenant' })
  listOwnerItems(@Query() query: MarketplaceQueryDto, @Request() req: AuthenticatedRequest) {
    return this.marketplaceService.listOwnerItems(getScopedTenantId(req), query);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List active marketplace subscriptions for the current tenant' })
  listSubscriptions(@Request() req: AuthenticatedRequest) {
    return this.marketplaceService.listSubscriptions(getScopedTenantId(req));
  }

  @Get('revenue-report')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Revenue and usage report for resources owned by this tenant' })
  getRevenueReport(
    @Query() query: MarketplaceReportQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.getRevenueReport(getScopedTenantId(req), query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get marketplace item details when published, owned, or subscribed' })
  getItem(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.marketplaceService.getItem(id, getScopedTenantId(req));
  }

  @Patch('items/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a marketplace item owned by the current tenant' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarketplaceItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.updateItem(getScopedTenantId(req), id, dto);
  }

  @Post('items/:id/subscriptions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Subscribe current tenant to a published marketplace item' })
  subscribe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubscribeMarketplaceItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.subscribe(getScopedTenantId(req), id, dto);
  }

  @Get('items/:id/course-package')
  @ApiOperation({
    summary: 'Read a subscribed cross-tenant course package without copying content',
  })
  getCoursePackage(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.marketplaceService.getCoursePackage(id, getScopedTenantId(req), req.user.id);
  }

  @Post('items/:id/signed-url')
  @ApiOperation({ summary: 'Create a signed read URL for a subscribed media asset' })
  createSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignedUrlRequestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.createMediaSignedUrl(
      id,
      getScopedTenantId(req),
      req.user.id,
      dto,
    );
  }

  @Post('items/:id/usage-events')
  @ApiOperation({ summary: 'Record metered cross-tenant resource usage' })
  createUsageEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMarketplaceUsageEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.marketplaceService.createUsageEvent(id, getScopedTenantId(req), req.user.id, dto);
  }
}
