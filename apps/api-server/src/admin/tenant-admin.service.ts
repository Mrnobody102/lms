import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantAdminService {
  constructor(private prisma: PrismaService) {}

  async createTenant(createTenantDto: CreateTenantDto) {
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

  async updateTenant(tenantId: string, updateTenantDto: UpdateTenantDto) {
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
        },
      });

      return updatedTenant;
    });
  }

  async deleteTenant(tenantId: string) {
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
    return tenant;
  }

  async restoreTenant(tenantId: string) {
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
    return tenant;
  }
}
