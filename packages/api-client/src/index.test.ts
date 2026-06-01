import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './index';

class MemoryStorage implements Storage {
  private storage = new Map<string, string>();

  get length() {
    return this.storage.size;
  }

  clear() {
    this.storage.clear();
  }

  getItem(key: string) {
    return this.storage.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.storage.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.storage.delete(key);
  }

  setItem(key: string, value: string) {
    this.storage.set(key, value);
  }
}

function createResponse<T>(
  config: InternalAxiosRequestConfig,
  status: number,
  data: T,
): AxiosResponse<T> {
  return {
    config,
    data,
    headers: {},
    status,
    statusText: status === 200 ? 'OK' : 'Error',
  };
}

function rejectWithStatus(config: InternalAxiosRequestConfig, status: number) {
  const response = createResponse(config, status, { message: 'Unauthorized' });
  return Promise.reject(new AxiosError('Request failed', undefined, config, undefined, response));
}

beforeEach(() => {
  vi.stubGlobal('window', {
    dispatchEvent: vi.fn(),
    location: {
      pathname: '/en/dashboard',
      search: '',
      assign: vi.fn(),
    },
  });
  vi.stubGlobal('document', { cookie: '' });
  vi.stubGlobal('localStorage', new MemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createApiClient', () => {
  it('uses the same-origin API rewrite for browser requests', () => {
    const api = createApiClient();

    expect(api.defaults.baseURL).toBe('/api');
  });

  it('refreshes and retries a 401 request even when redirect is skipped', async () => {
    const api = createApiClient({ baseURL: '/api' });
    const calls: string[] = [];
    let meAttempts = 0;

    const adapter: AxiosAdapter = async (config) => {
      const requestConfig: InternalAxiosRequestConfig = {
        ...config,
        headers: AxiosHeaders.from(config.headers),
      };
      const url = requestConfig.url ?? '';
      calls.push(url);

      if (url === '/users/me') {
        meAttempts += 1;
        if (meAttempts === 1) {
          return rejectWithStatus(requestConfig, 401);
        }

        return createResponse(requestConfig, 200, {
          id: 'user-1',
          email: 'admin@example.com',
        });
      }

      if (url === '/auth/refresh') {
        return createResponse(requestConfig, 200, { success: true });
      }

      throw new Error(`Unexpected request: ${url}`);
    };

    api.defaults.adapter = adapter;

    const response = await api.get('/users/me', {
      skipUnauthorizedRedirect: true,
    });

    expect(response.data).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
    });
    expect(calls).toEqual(['/users/me', '/auth/refresh', '/users/me']);
  });

  it('does not redirect when skipped request and refresh are both unauthorized', async () => {
    const api = createApiClient({ baseURL: '/api' });
    const calls: string[] = [];

    api.defaults.adapter = async (config) => {
      const requestConfig: InternalAxiosRequestConfig = {
        ...config,
        headers: AxiosHeaders.from(config.headers),
      };
      const url = requestConfig.url ?? '';
      calls.push(url);
      return rejectWithStatus(requestConfig, 401);
    };

    await expect(api.get('/users/me', { skipUnauthorizedRedirect: true })).rejects.toThrow(
      'Request failed',
    );

    expect(calls).toEqual(['/users/me', '/auth/refresh']);
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('clears legacy token storage and redirects after refresh fails for protected requests', async () => {
    const api = createApiClient({ baseURL: '/api' });
    const calls: string[] = [];
    localStorage.setItem('token', 'legacy-token');
    localStorage.setItem('user', '{"id":"user-1"}');
    localStorage.setItem('tenantId', 'tenant-1');

    api.defaults.adapter = async (config) => {
      const requestConfig: InternalAxiosRequestConfig = {
        ...config,
        headers: AxiosHeaders.from(config.headers),
      };
      const url = requestConfig.url ?? '';
      calls.push(url);
      return rejectWithStatus(requestConfig, 401);
    };

    await expect(api.get('/courses')).rejects.toThrow('Request failed');

    expect(calls).toEqual(['/courses', '/auth/refresh']);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('tenantId')).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('/en/login?returnUrl=%2Fen%2Fdashboard');
  });
});
