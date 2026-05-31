import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';

@Injectable()
export class TenantAdminService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createTenant(createTenantDto: CreateTenantDto, currentUser?: AuthenticatedUser) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant slug already exists');
    }

    if (createTenantDto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: createTenantDto.domain },
      });
      if (existingDomain) {
        throw new BadRequestException('Tenant domain already exists');
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

    if (currentUser) {
      await this.auditLog.log({
        tenantId: tenant.id,
        userId: currentUser.id,
        action: AuditAction.TENANT_CREATE,
        status: AuditStatus.SUCCESS,
        metadata: { name: tenant.name, slug: tenant.slug, domain: tenant.domain },
      });
    }

    return tenant;
  }

  async getTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return tenants;
  }

  async getAllTenants(includeInactive = false) {
    const tenants = await this.prisma.tenant.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return tenants;
  }

  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(
    tenantId: string,
    updateTenantDto: UpdateTenantDto,
    currentUser?: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
        const existingTenant = await tx.tenant.findUnique({
          where: { slug: updateTenantDto.slug },
        });
        if (existingTenant) {
          throw new BadRequestException('Tenant slug already exists');
        }
      }

      if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
        const existingDomain = await tx.tenant.findUnique({
          where: { domain: updateTenantDto.domain },
        });
        if (existingDomain) {
          throw new BadRequestException('Tenant domain already exists');
        }
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: updateTenantDto.name,
          slug: updateTenantDto.slug,
          domain: updateTenantDto.domain,
          settings: updateTenantDto.settings ?? undefined,
          isActive: updateTenantDto.isActive,
        },
      });

      if (currentUser) {
        await this.auditLog.log({
          tenantId,
          userId: currentUser.id,
          action: AuditAction.TENANT_UPDATE,
          status: AuditStatus.SUCCESS,
          metadata: {
            name: updateTenantDto.name,
            slug: updateTenantDto.slug,
            domain: updateTenantDto.domain,
            isActive: updateTenantDto.isActive,
            settingsUpdated: updateTenantDto.settings !== undefined,
          },
        });
      }

      return updatedTenant;
    });
  }

  async deleteTenant(tenantId: string, currentUser?: AuthenticatedUser) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });
    if (currentUser) {
      await this.auditLog.log({
        tenantId,
        userId: currentUser.id,
        action: AuditAction.TENANT_DEACTIVATE,
        status: AuditStatus.SUCCESS,
        metadata: { name: tenant.name, slug: tenant.slug },
      });
    }
    return tenant;
  }

  async restoreTenant(tenantId: string, currentUser?: AuthenticatedUser) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });
    if (currentUser) {
      await this.auditLog.log({
        tenantId,
        userId: currentUser.id,
        action: AuditAction.TENANT_RESTORE,
        status: AuditStatus.SUCCESS,
        metadata: { name: tenant.name, slug: tenant.slug },
      });
    }
    return tenant;
  }
}
