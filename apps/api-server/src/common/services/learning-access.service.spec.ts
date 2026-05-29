import { Role } from '@repo/database';
import { describe, expect, it } from 'vitest';
import { LearningAccessService } from './learning-access.service';

describe('LearningAccessService', () => {
  it('should scope instructor course access to assigned courses', () => {
    const service = new LearningAccessService({} as never);

    expect(
      service.courseWhere('tenant-1', { id: 'instructor-1', role: Role.INSTRUCTOR }, 'course-1'),
    ).toEqual({
      tenantId: 'tenant-1',
      deletedAt: null,
      isActive: true,
      id: 'course-1',
      instructorAssignments: {
        some: {
          instructorId: 'instructor-1',
          tenantId: 'tenant-1',
        },
      },
    });
  });
});
