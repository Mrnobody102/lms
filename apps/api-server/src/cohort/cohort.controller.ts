import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CohortService } from './cohort.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { AddCohortMembersDto } from './dto/add-cohort-members.dto';
import { EnrollCohortDto } from './dto/enroll-cohort.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { getScopedTenantId } from '../common/utils/tenant-request.util';

type AuthRequest = Request & {
  user: { id: string; tenantId: string; role: Role };
  tenantId?: string;
};

@ApiTags('Cohorts')
@ApiBearerAuth()
@Controller('cohorts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @Post()
  @ApiOperation({ summary: 'Create a cohort/class in the current tenant' })
  @ApiResponse({ status: 201, description: 'Cohort created' })
  create(@Req() req: AuthRequest, @Body() createCohortDto: CreateCohortDto) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.create(tenantId, createCohortDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List active cohorts/classes in the current tenant' })
  @ApiResponse({ status: 200, description: 'Cohort list returned' })
  findAll(@Req() req: AuthRequest) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one cohort/class by ID' })
  @ApiResponse({ status: 200, description: 'Cohort returned' })
  findOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cohort/class' })
  @ApiResponse({ status: 200, description: 'Cohort updated' })
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCohortDto: UpdateCohortDto,
  ) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.update(tenantId, id, updateCohortDto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a cohort/class' })
  @ApiResponse({ status: 200, description: 'Cohort soft-deleted' })
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.remove(tenantId, id, req.user?.id);
  }

  // --- Membership Management ---

  @Get(':id/members')
  @ApiOperation({ summary: 'List members in a cohort/class' })
  @ApiResponse({ status: 200, description: 'Cohort member list returned' })
  getMembers(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.getMembers(tenantId, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to a cohort/class' })
  @ApiResponse({ status: 201, description: 'Members added or skipped if already present' })
  addMembers(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addCohortMembersDto: AddCohortMembersDto,
  ) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.addMembers(tenantId, id, addCohortMembersDto.userIds, req.user?.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove one member from a cohort/class' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  removeMember(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.removeMember(tenantId, id, userId, req.user?.id);
  }

  // --- Actions ---

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll all cohort/class members into a course' })
  @ApiResponse({ status: 201, description: 'Cohort enrollment completed' })
  enrollIntoCourse(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() enrollCohortDto: EnrollCohortDto,
  ) {
    const tenantId = getScopedTenantId(req);
    const adminUserId = req.user?.id || 'system';
    return this.cohortService.enrollIntoCourse(tenantId, id, enrollCohortDto.courseId, adminUserId);
  }
}
