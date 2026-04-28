# Test Patterns Reference

Deep-dive reference for testing the LMS NestJS API with Vitest + Supertest.

## NestJS Testing Module Setup

### Basic Controller Test

```typescript
// lesson.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';

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

  it('should call create with tenantId from request', async () => {
    const dto = { title: 'Test', courseId: 'course-1' };
    const req = { tenantId: 'tenant-1' };
    await controller.create(dto as any, req as any);
    expect(service.create).toHaveBeenCalledWith({ ...dto, tenantId: 'tenant-1' });
  });

  it('should call findAll with courseId and tenantId', async () => {
    const req = { tenantId: 'tenant-1' };
    await controller.findAll('course-1', req as any);
    expect(service.findAll).toHaveBeenCalledWith('course-1', 'tenant-1');
  });

  it('should call findOne with id and tenantId', async () => {
    const req = { tenantId: 'tenant-1' };
    await controller.findOne('lesson-1', req as any);
    expect(service.findOne).toHaveBeenCalledWith('lesson-1', 'tenant-1');
  });
});
```

### Service Unit Test with Prisma Mock

```typescript
// lesson.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { PrismaService } from './common/services/prisma.service';

describe('LessonService', () => {
  let service: LessonService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      lesson: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      course: { findFirst: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<LessonService>(LessonService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('findOne', () => {
    it('should return lesson when found', async () => {
      const mockLesson = { id: '1', title: 'Test', tenantId: 'tenant-1' };
      prismaService.lesson.findFirst.mockResolvedValue(mockLesson);
      const result = await service.findOne('1', 'tenant-1');
      expect(result).toEqual(mockLesson);
    });

    it('should throw NotFoundException when lesson not found', async () => {
      prismaService.lesson.findFirst.mockResolvedValue(null);
      await expect(service.findOne('invalid', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should throw NotFoundException when course not found', async () => {
      prismaService.course.findFirst.mockResolvedValue(null);
      await expect(
        service.create({
          title: 'Test',
          courseId: 'invalid',
          tenantId: 'tenant-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create lesson when course exists', async () => {
      prismaService.course.findFirst.mockResolvedValue({ id: 'course-1' });
      prismaService.lesson.create.mockResolvedValue({ id: '1', title: 'Test' });
      const result = await service.create({
        title: 'Test',
        courseId: 'course-1',
        tenantId: 'tenant-1',
      });
      expect(result.id).toBe('1');
    });
  });

  describe('findAll', () => {
    it('should return lessons for course and tenant', async () => {
      const lessons = [{ id: '1' }, { id: '2' }];
      prismaService.lesson.findMany.mockResolvedValue(lessons);
      const result = await service.findAll('course-1', 'tenant-1');
      expect(result).toEqual(lessons);
      expect(prismaService.lesson.findMany).toHaveBeenCalledWith({
        where: { courseId: 'course-1', tenantId: 'tenant-1' },
        orderBy: { order: 'asc' },
      });
    });
  });
});
```

## Auth Test Matrix

### Auth Controller Tests

```typescript
describe('AuthController', () => {
  describe('POST /auth/register', () => {
    it('should return 201 with user when registration is successful', async () => {
      authServiceMock.register.mockResolvedValue({ user: { id: 'user-1' } });
      const result = await controller.register(validRegisterDto, {});
      expect(result.user).toBeDefined();
      expect(result).not.toHaveProperty('token');
    });

    it('should return 422 when email is already taken', async () => {
      authServiceMock.register.mockRejectedValue(new ConflictException('Email already in use'));
      await expect(controller.register(validRegisterDto, {})).rejects.toThrow(ConflictException);
    });

    it('should return 422 when password is too short', async () => {
      const dto = { ...validRegisterDto, password: '123' };
      await expect(controller.register(dto, {})).rejects.toThrow();
    });

    it('should return 422 when email format is invalid', async () => {
      const dto = { ...validRegisterDto, email: 'not-an-email' };
      await expect(controller.register(dto, {})).rejects.toThrow();
    });

    it('should return 422 when tenantId is missing', async () => {
      const dto = { ...validRegisterDto, tenantId: undefined };
      await expect(controller.register(dto, {})).rejects.toThrow();
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 with user when credentials are valid', async () => {
      authServiceMock.login.mockResolvedValue({ user: { id: 'user-1' } });
      const result = await controller.login(validLoginDto);
      expect(result.user).toBeDefined();
      expect(result).not.toHaveProperty('token');
    });

    it('should return 401 when email is not found', async () => {
      authServiceMock.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      await expect(
        controller.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return 401 when password is incorrect', async () => {
      authServiceMock.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      await expect(
        controller.login({ email: 'user@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return 422 when email format is invalid', async () => {
      await expect(
        controller.login({ email: 'not-an-email', password: 'password123' }),
      ).rejects.toThrow();
    });

    it('should return 422 when password is too short', async () => {
      await expect(
        controller.login({ email: 'user@example.com', password: '123' }),
      ).rejects.toThrow();
    });
  });
});
```

## Validation Test Matrix

### DTO Validation Tests

```typescript
describe('RegisterDto validation', () => {
  const validate = (dto: Partial<RegisterDto>) => validateDto(dto, RegisterDto);

  it('should pass with valid dto', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe',
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(errors.length).toBe(0);
  });

  it('should fail when email is invalid', async () => {
    const errors = await validate({
      email: 'not-email',
      password: 'password123',
      fullName: 'John',
      tenantId: 'uuid',
    });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail when password is less than 8 characters', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: '1234567',
      fullName: 'John',
      tenantId: 'uuid',
    });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail when password exceeds 128 characters', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: 'a'.repeat(129),
      fullName: 'John',
      tenantId: 'uuid',
    });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail when fullName is empty', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: 'password123',
      fullName: '',
      tenantId: 'uuid',
    });
    expect(errors.some((e) => e.property === 'fullName')).toBe(true);
  });

  it('should fail when tenantId is not a valid UUID', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John',
      tenantId: 'not-uuid',
    });
    expect(errors.some((e) => e.property === 'tenantId')).toBe(true);
  });

  it('should allow optional phoneNumber', async () => {
    const errors = await validate({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John',
      tenantId: 'uuid',
      phoneNumber: '+84 123 456 789',
    });
    expect(errors.length).toBe(0);
  });

  it('should fail on SQL injection in email', async () => {
    const errors = await validate({
      email: "'; DROP TABLE users; --",
      password: 'password123',
      fullName: 'John',
      tenantId: 'uuid',
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

## Pagination Test Patterns

```typescript
describe('Pagination patterns', () => {
  it('should return default page 1 with limit 10 when no params provided', async () => {
    prismaService.lesson.findMany.mockResolvedValue(generateLessons(10));
    prismaService.lesson.count.mockResolvedValue(25);
    const result = await service.findAll('course-1', 'tenant-1');
    expect(result.data).toHaveLength(10);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  it('should return correct items for page 2 with limit 5', async () => {
    prismaService.lesson.findMany.mockResolvedValue(generateLessons(5, 5));
    prismaService.lesson.count.mockResolvedValue(25);
    const result = await service.findAll('course-1', 'tenant-1', { page: 2, limit: 5 });
    expect(result.meta.page).toBe(2);
    expect(result.meta.totalPages).toBe(5);
  });

  it('should return empty array for oversized page', async () => {
    prismaService.lesson.findMany.mockResolvedValue([]);
    prismaService.lesson.count.mockResolvedValue(5);
    const result = await service.findAll('course-1', 'tenant-1', { page: 99, limit: 10 });
    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(5);
  });

  it('should cap limit at maximum allowed value', async () => {
    prismaService.lesson.findMany.mockImplementation(({ take }) => generateLessons(take));
    prismaService.lesson.count.mockResolvedValue(200);
    const result = await service.findAll('course-1', 'tenant-1', { page: 1, limit: 1000 });
    expect(result.meta.limit).toBeLessThanOrEqual(100);
  });

  it('should use default limit when limit is 0', async () => {
    prismaService.lesson.findMany.mockImplementation(({ take }) => generateLessons(take));
    prismaService.lesson.count.mockResolvedValue(20);
    const result = await service.findAll('course-1', 'tenant-1', { page: 1, limit: 0 });
    expect(result.meta.limit).toBe(10);
  });
});
```

## Tenant Isolation Tests

```typescript
describe('Tenant isolation', () => {
  it('should pass tenantId to all Prisma queries', async () => {
    prismaService.lesson.findMany.mockResolvedValue([]);
    prismaService.lesson.count.mockResolvedValue(0);

    await service.findAll('course-1', 'tenant-1');

    expect(prismaService.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    );
  });

  it('should not find lesson from different tenant', async () => {
    prismaService.lesson.findFirst.mockResolvedValue(null);
    await expect(service.findOne('lesson-1', 'tenant-2')).rejects.toThrow(NotFoundException);
  });

  it('should not allow updating lesson from different tenant', async () => {
    prismaService.lesson.findFirst.mockResolvedValue(null);
    await expect(service.update('lesson-1', 'tenant-2', {})).rejects.toThrow(NotFoundException);
  });

  it('should not allow deleting lesson from different tenant', async () => {
    prismaService.lesson.findFirst.mockResolvedValue(null);
    await expect(service.remove('lesson-1', 'tenant-2')).rejects.toThrow(NotFoundException);
  });
});
```
