import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Program Methods ---

  async create(createDto: CreateProgramDto, tenantId: string) {
    return this.prisma.program.create({
      data: {
        title: createDto.title,
        slug: createDto.slug,
        description: createDto.description,
        isActive: createDto.isActive ?? true,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.program.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { levels: true } },
        levels: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { courses: true } },
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const program = await this.prisma.program.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        levels: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { courses: true } },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async update(id: string, tenantId: string, updateDto: UpdateProgramDto) {
    await this.findOne(id, tenantId); // ensure exists
    return this.prisma.program.update({
      where: { id_tenantId: { id, tenantId } },
      data: {
        title: updateDto.title,
        slug: updateDto.slug,
        description: updateDto.description,
        isActive: updateDto.isActive,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // ensure exists
    return this.prisma.program.update({
      where: { id_tenantId: { id, tenantId } },
      data: { deletedAt: new Date() },
    });
  }

  // --- Level Methods ---

  async createLevel(programId: string, tenantId: string, createDto: CreateLevelDto) {
    await this.findOne(programId, tenantId); // ensure program exists

    return this.prisma.level.create({
      data: {
        title: createDto.title,
        description: createDto.description,
        order: createDto.order ?? 0,
        isActive: createDto.isActive ?? true,
        programId,
        tenantId,
      },
    });
  }

  async updateLevel(
    levelId: string,
    programId: string,
    tenantId: string,
    updateDto: UpdateLevelDto,
  ) {
    const level = await this.prisma.level.findFirst({
      where: { id: levelId, programId, tenantId, deletedAt: null },
    });

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    return this.prisma.level.update({
      where: { id_tenantId: { id: levelId, tenantId } },
      data: {
        title: updateDto.title,
        description: updateDto.description,
        order: updateDto.order,
        isActive: updateDto.isActive,
      },
    });
  }

  async removeLevel(levelId: string, programId: string, tenantId: string) {
    const level = await this.prisma.level.findFirst({
      where: { id: levelId, programId, tenantId, deletedAt: null },
    });

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    // Soft delete
    return this.prisma.level.update({
      where: { id_tenantId: { id: levelId, tenantId } },
      data: { deletedAt: new Date() },
    });
  }
}
