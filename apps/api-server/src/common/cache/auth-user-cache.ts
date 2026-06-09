import { TtlCache } from './ttl-cache';

/**
 * Shared cache of validated JWT users, keyed by user id. Lets the auth hot
 * path skip a per-request database lookup while still honouring immediate
 * revocation: any code that bumps a user's `tokenVersion` (password reset,
 * forced logout, role/security change) must call `invalidateAuthUser` so the
 * next request re-validates against the database with no delay.
 */
export interface CachedAuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  tenantId: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const AUTH_USER_CACHE_TTL_MS = 30_000;
const authUserCache = new TtlCache<CachedAuthUser>(AUTH_USER_CACHE_TTL_MS);

export function getCachedAuthUser(userId: string): CachedAuthUser | undefined {
  return authUserCache.get(userId);
}

export function setCachedAuthUser(user: CachedAuthUser): void {
  authUserCache.set(user.id, user);
}

/** Drop a user's cached auth record so the next request re-validates from the DB. */
export function invalidateAuthUser(userId: string): void {
  authUserCache.delete(userId);
}

/** Drop all cached auth records for a tenant after tenant status changes. */
export function invalidateAuthUsersForTenant(tenantId: string): void {
  authUserCache.deleteWhere((user) => user.tenantId === tenantId);
}

/** Test-only: clear the entire cache between cases. */
export function clearAuthUserCacheForTests(): void {
  authUserCache.clear();
}
