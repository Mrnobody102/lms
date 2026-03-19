import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@repo/database";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: "Get paginated list of users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getUserList(
    @CurrentUser() user: any,
    @Query() query: AdminUserQueryDto,
  ): Promise<any> {
    return this.adminService.getUserList(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(
    @CurrentUser() user: any,
    @Param("id") userId: string,
  ): Promise<any> {
    return this.adminService.getUserById(user, userId);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update a user's active status" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async updateUserStatus(
    @CurrentUser() user: any,
    @Param("id") userId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<any> {
    return this.adminService.updateUserStatus(
      user,
      userId,
      updateUserStatusDto,
    );
  }
}
