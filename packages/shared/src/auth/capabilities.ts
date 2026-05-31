export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export type Capability =
  | 'dashboard:view'
  | 'program:read'
  | 'program:manage'
  | 'course:read'
  | 'course:manage'
  | 'course:author-assigned'
  | 'class:read'
  | 'class:manage'
  | 'class:teach-assigned'
  | 'student:read'
  | 'student:manage'
  | 'instructor:read'
  | 'instructor:manage'
  | 'schedule:read'
  | 'schedule:manage'
  | 'finance:manage'
  | 'report:read'
  | 'notification:manage'
  | 'marketplace:manage'
  | 'tenant:manage'
  | 'settings:manage';

const ADMIN_CAPABILITIES: Capability[] = [
  'dashboard:view',
  'program:read',
  'program:manage',
  'course:read',
  'course:manage',
  'class:read',
  'class:manage',
  'student:read',
  'student:manage',
  'instructor:read',
  'instructor:manage',
  'schedule:read',
  'schedule:manage',
  'finance:manage',
  'report:read',
  'notification:manage',
  'marketplace:manage',
  'tenant:manage',
  'settings:manage',
];

const INSTRUCTOR_CAPABILITIES: Capability[] = [
  'dashboard:view',
  'program:read',
  'course:read',
  'course:author-assigned',
  'class:read',
  'class:teach-assigned',
  'student:read',
  'schedule:read',
  'report:read',
  'settings:manage',
];

const STUDENT_CAPABILITIES: Capability[] = [];

export const ROLE_CAPABILITIES: Record<AppRole, Capability[]> = {
  SUPER_ADMIN: ADMIN_CAPABILITIES,
  ADMIN: ADMIN_CAPABILITIES,
  INSTRUCTOR: INSTRUCTOR_CAPABILITIES,
  STUDENT: STUDENT_CAPABILITIES,
};

export function hasCapability(role: string | undefined, capability: Capability) {
  return isAppRole(role) && ROLE_CAPABILITIES[role].includes(capability);
}

function isAppRole(role: string | undefined): role is AppRole {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'INSTRUCTOR' || role === 'STUDENT';
}
