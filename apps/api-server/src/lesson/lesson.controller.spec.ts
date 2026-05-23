import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';

describe('LessonController', () => {
  let controller: LessonController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    reorderLessons: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      create: vi.fn().mockResolvedValue({ id: '1', title: 'Test Lesson' }),
      findAll: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Lesson' }]),
      findOne: vi.fn().mockResolvedValue({ id: '1', title: 'Test Lesson' }),
      update: vi.fn().mockResolvedValue({ id: '1', title: 'Updated Lesson' }),
      remove: vi.fn().mockResolvedValue({ id: '1' }),
      reorderLessons: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [{ provide: LessonService, useValue: service }],
    }).compile();

    controller = module.get<LessonController>(LessonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto = { title: 'Test', courseId: 'course-1' };

    await controller.create(
      dto as any,
      {
        tenantId: 'tenant-1',
        user: { tenantId: 'tenant-1', role: 'ADMIN' },
      } as any,
    );

    expect(service.create).toHaveBeenCalled();
  });

  it('should call findAll', async () => {
    await controller.findAll(
      'course-1',
      {} as any,
      {
        tenantId: 'tenant-1',
        user: { tenantId: 'tenant-1', role: 'ADMIN' },
      } as any,
    );

    expect(service.findAll).toHaveBeenCalled();
  });
});
