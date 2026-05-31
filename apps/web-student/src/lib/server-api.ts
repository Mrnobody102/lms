import { cookies } from 'next/headers';
import { DEFAULT_DEMO_TENANT_ID, type AuthUser } from '@repo/shared';
import type { StudentTodayResponse } from './student-api';

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')}/api`;
  }
  // Default development fallback
  return 'http://127.0.0.1:4000/api';
}

/**
 * Fetch data from the API Server during Server-Side Rendering (RSC).
 * It forwards the incoming cookies (e.g. access_token) and the tenant ID.
 */
async function serverFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  // Read all incoming cookies
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_DEMO_TENANT_ID;

  const url = `${getBaseUrl()}${endpoint}`;

  const headers = new Headers(init?.headers);

  // Forward cookies to authorize on the API server
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  // Attach tenant context
  headers.set('x-tenant-id', tenantId);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    cache: init?.cache ?? 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export const serverApi = {
  getMe: async () => {
    try {
      return await serverFetch<AuthUser>('/users/me');
    } catch (_error) {
      return null; // Return null if unauthenticated (e.g. 401)
    }
  },

  getStudentToday: async () => {
    try {
      return await serverFetch<StudentTodayResponse>('/student/today');
    } catch (_error) {
      return null;
    }
  },
};
