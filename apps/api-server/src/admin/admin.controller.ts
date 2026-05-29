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
import { Role } from '@repo/database';
import { UserAdminService } from './user-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private userAdminService: UserAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserList(@CurrentUser() user: AuthenticatedUser, @Query() query: AdminUserQueryDto) {
    return this.userAdminService.getUserList(user, query);
  }

  @Post('instructors')
  @ApiOperation({ summary: 'Create an instructor account in the current tenant' })
  @ApiResponse({ status: 201, description: 'Instructor created successfully' })
  async createInstructor(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: AuthenticatedRequest,
    @Body() createInstructorDto: CreateInstructorDto,
  ) {
    return this.userAdminService.createInstructor(
      user,
      getScopedTenantId(req),
      createInstructorDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) userId: string,
  ) {
    return this.userAdminService.getUserById(user, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: "Update a user's active status" })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.userAdminService.updateUserStatus(user, userId, updateUserStatusDto);
  }
}
