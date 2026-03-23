import { Test, TestingModule } from '@nestjs/testing';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LessonController', () => {
  let controller: LessonController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: vi.fn().mockResolvedValue({ id: '1', title: 'Test Lesson' }),
      findAll: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Lesson' }]),
      findOne: vi.fn().mockResolvedValue({ id: '1', title: 'Test Lesson' }),
      update: vi.fn().mockResolvedValue({ id: '1', title: 'Updated Lesson' }),
      remove: vi.fn().mockResolvedValue({ id: '1' }),
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
    await controller.create(dto as any, { tenantId: 'tenant-1' } as any);
    expect(service.create).toHaveBeenCalled();
  });

  it('should call findAll', async () => {
    await controller.findAll('course-1', {} as any, { tenantId: 'tenant-1' } as any);
    expect(service.findAll).toHaveBeenCalled();
  });
});
