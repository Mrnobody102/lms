import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, Role } from "@repo/database";
import { PrismaService } from "../common/services/prisma.service";
import { AdminUserQueryDto } from "./dto/admin-user-query.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { AuthenticatedUser } from "../progress/dto/authenticated-request.interface";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUserList(currentUser: AuthenticatedUser, query: AdminUserQueryDto) {
    const { page = 1, limit = 10, email, role, isActive } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // ADMIN can only see users in their tenant
    // SUPER_ADMIN can see all users across all tenants
    if (currentUser.role === Role.ADMIN) {
      where.tenantId = currentUser.tenantId;
    }

    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(currentUser: AuthenticatedUser, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // ADMIN can only view users in their tenant
    if (
      currentUser.role === Role.ADMIN &&
      user.tenantId !== currentUser.tenantId
    ) {
      throw new ForbiddenException("You can only view users in your tenant");
    }

    return user;
  }

  async updateUserStatus(
    currentUser: AuthenticatedUser,
    userId: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
    // Get the user to check tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // ADMIN can only update users in their tenant
    if (
      currentUser.role === Role.ADMIN &&
      user.tenantId !== currentUser.tenantId
    ) {
      throw new ForbiddenException("You can only update users in your tenant");
    }

    // Prevent deactivating yourself
    if (userId === currentUser.id) {
      throw new ForbiddenException("You cannot change your own status");
    }

    // Update user status
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: updateUserStatusDto.isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // --- Tenant Management ---

  async createTenant(createTenantDto: CreateTenantDto) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existingTenant) {
      throw new BadRequestException("Tenant slug already exists");
    }

    if (createTenantDto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: createTenantDto.domain },
      });
      if (existingDomain) {
        throw new BadRequestException("Tenant domain already exists");
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        domain: createTenantDto.domain,
        settings: createTenantDto.settings || {},
      },
    });

    return tenant;
  }

  async getTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });
    return tenants;
  }

  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async updateTenant(
    tenantId: string,
    updateTenantDto: UpdateTenantDto,
  ) {
    // Use transaction to ensure atomicity of validation + update
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException("Tenant not found");
      }

      if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
        const existingTenant = await tx.tenant.findUnique({
          where: { slug: updateTenantDto.slug },
        });
        if (existingTenant) {
          throw new BadRequestException("Tenant slug already exists");
        }
      }

      if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
        const existingDomain = await tx.tenant.findUnique({
          where: { domain: updateTenantDto.domain },
        });
        if (existingDomain) {
          throw new BadRequestException("Tenant domain already exists");
        }
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: updateTenantDto.name,
          slug: updateTenantDto.slug,
          domain: updateTenantDto.domain,
          settings: updateTenantDto.settings ?? undefined,
        },
      });

      return updatedTenant;
    });
  }

  async deleteTenant(tenantId: string) {
    // Check tenant exists first
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException("Tenant not found");
    }

    // Soft Delete: update isActive to false
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });
    return tenant;
  }

  async restoreTenant(tenantId: string) {
    // Check tenant exists first
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException("Tenant not found");
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });
    return tenant;
  }
}
