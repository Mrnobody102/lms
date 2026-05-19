import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, options: { includeInactive?: boolean } = {}) {
    return this.prisma.skill.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(options.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const skill = await this.prisma.skill.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found in this tenant');
    }
    return skill;
  }

  async create(tenantId: string, data: CreateSkillDto) {
    try {
      return await this.prisma.skill.create({
        data: {
          tenantId,
          code: data.code,
          name: data.name,
          nameVi: data.nameVi,
          color: data.color,
          description: data.description,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Skill with code "${data.code}" already exists`);
      }
      throw error;
    }
  }

  async update(tenantId: string, id: string, data: UpdateSkillDto) {
    await this.findOne(tenantId, id);
    return this.prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        nameVi: data.nameVi,
        color: data.color,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    const skill = await this.findOne(tenantId, id);
    return this.prisma.skill.update({
      where: { id: skill.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
