import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
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

@Controller('cohorts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN') // Only admins can manage cohorts
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() createCohortDto: CreateCohortDto) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.create(tenantId, createCohortDto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateCohortDto: UpdateCohortDto,
  ) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.update(tenantId, id, updateCohortDto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.remove(tenantId, id);
  }

  // --- Membership Management ---

  @Get(':id/members')
  getMembers(@Req() req: AuthRequest, @Param('id') id: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.getMembers(tenantId, id);
  }

  @Post(':id/members')
  addMembers(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() addCohortMembersDto: AddCohortMembersDto,
  ) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.addMembers(tenantId, id, addCohortMembersDto.userIds);
  }

  @Delete(':id/members/:userId')
  removeMember(@Req() req: AuthRequest, @Param('id') id: string, @Param('userId') userId: string) {
    const tenantId = getScopedTenantId(req);
    return this.cohortService.removeMember(tenantId, id, userId);
  }

  // --- Actions ---

  @Post(':id/enroll')
  enrollIntoCourse(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() enrollCohortDto: EnrollCohortDto,
  ) {
    const tenantId = getScopedTenantId(req);
    const adminUserId = req.user?.id || 'system';
    return this.cohortService.enrollIntoCourse(tenantId, id, enrollCohortDto.courseId, adminUserId);
  }
}
