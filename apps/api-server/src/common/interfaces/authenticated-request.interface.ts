import { Role } from '@repo/database';
import { TenantAwareRequest } from '../utils/tenant-request.util';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends TenantAwareRequest {
  user: AuthenticatedUser;
}
