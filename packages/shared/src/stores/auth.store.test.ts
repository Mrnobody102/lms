import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthStore, type AuthUser } from './auth.store';

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

function createApiMock() {
  return {
    get: vi.fn(),
    post: vi.fn(),
  };
}

const authUser: AuthUser = {
  id: 'user-1',
  email: 'student@example.com',
  fullName: 'Student User',
  role: 'STUDENT',
  tenantId: 'tenant-1',
};

beforeEach(() => {
  const storage = new MemoryStorage();
  vi.stubGlobal('window', {} as Window);
  vi.stubGlobal('localStorage', storage);
});

describe('createAuthStore', () => {
  it('hydrates the authenticated user from /users/me without restoring a local token', async () => {
    const api = createApiMock();
    vi.mocked(api.get).mockResolvedValue({ data: authUser });

    const store = createAuthStore({ api, persistUser: true });

    await store.getState().checkAuth();

    expect(api.get).toHaveBeenCalledWith('/users/me', {
      skipUnauthorizedRedirect: true,
    });
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(authUser);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBe(JSON.stringify(authUser));
  });

  it('logs in successfully without persisting the access token to localStorage', async () => {
    const api = createApiMock();
    vi.mocked(api.post).mockResolvedValue({
      data: {
        user: authUser,
      },
    });

    const store = createAuthStore({ api, persistUser: true });

    const result = await store.getState().login('student@example.com', 'password');

    expect(result).toBe(true);
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(authUser);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBe(JSON.stringify(authUser));
  });

  it('clears client auth state on logout after calling the backend endpoint', async () => {
    const api = createApiMock();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

    localStorage.setItem('token', 'legacy-token');
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('tenantId', authUser.tenantId);

    const store = createAuthStore({ api, persistUser: true });
    store.setState({
      user: authUser,
      isAuthenticated: true,
      isInitialized: true,
    });

    await store.getState().logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', null, {
      skipUnauthorizedRedirect: true,
    });
    expect(store.getState().isAuthenticated).toBe(false);
    expect(store.getState().user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('tenantId')).toBeNull();
  });
});
