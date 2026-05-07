import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthStore, type AuthUser } from './auth.store';

const AUTH_UNAUTHORIZED_EVENT = 'lms:auth:unauthorized';

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

function createWindowMock() {
  const listeners = new Map<string, Set<EventListener>>();
  const windowMock = {
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
      const callback: EventListener =
        typeof listener === 'function' ? listener : (event) => listener.handleEvent(event);
      const eventListeners = listeners.get(type) ?? new Set<EventListener>();
      eventListeners.add(callback);
      listeners.set(type, eventListeners);
    }),
    dispatchEvent: vi.fn((event: Event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    }),
  };

  return windowMock as unknown as Window;
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
  vi.stubGlobal('window', createWindowMock());
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAuthStore', () => {
  it('hydrates the authenticated user from /users/me without restoring a local token', async () => {
    const api = createApiMock();
    vi.mocked(api.get).mockResolvedValue({ data: authUser });

    const store = createAuthStore({ api, persistUser: true });

    await store.getState().checkAuth();

    expect(api.get).toHaveBeenCalledWith('/users/me', {
      skipUnauthorizedRedirect: true,
      timeout: 4000,
    });
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(authUser);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBe(JSON.stringify(authUser));
  });

  it('resets auth state and clears legacy storage when /users/me returns 401', async () => {
    const api = createApiMock();
    vi.mocked(api.get).mockRejectedValue({ response: { status: 401 } });

    localStorage.setItem('token', 'legacy-token');
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('tenantId', authUser.tenantId);

    const store = createAuthStore({ api, persistUser: true });
    store.setState({
      user: authUser,
      isAuthenticated: true,
      isInitialized: false,
      loading: true,
      error: 'old-error',
    });

    await store.getState().checkAuth();

    expect(store.getState()).toEqual(
      expect.objectContaining({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
        error: null,
      }),
    );
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('tenantId')).toBeNull();
  });

  it('keeps the current auth state when /users/me fails with a non-401 error', async () => {
    const api = createApiMock();
    vi.mocked(api.get).mockRejectedValue(new Error('network unavailable'));

    localStorage.setItem('user', JSON.stringify(authUser));

    const store = createAuthStore({ api, persistUser: true });
    store.setState({
      user: authUser,
      isAuthenticated: true,
      isInitialized: false,
      loading: true,
      error: 'old-error',
    });

    await store.getState().checkAuth();

    expect(store.getState()).toEqual(
      expect.objectContaining({
        user: authUser,
        isAuthenticated: true,
        isInitialized: true,
        loading: false,
        error: null,
      }),
    );
    expect(localStorage.getItem('user')).toBe(JSON.stringify(authUser));
  });

  it('resets auth state when the shared API client emits an unauthorized event', () => {
    const api = createApiMock();
    const store = createAuthStore({ api, persistUser: true });
    store.setState({
      user: authUser,
      isAuthenticated: true,
      isInitialized: true,
    });
    localStorage.setItem('user', JSON.stringify(authUser));

    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));

    expect(store.getState()).toEqual(
      expect.objectContaining({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
        error: null,
      }),
    );
    expect(localStorage.getItem('user')).toBeNull();
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
    expect(api.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        email: 'student@example.com',
        password: 'password',
      },
      {
        skipUnauthorizedRedirect: true,
      },
    );
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(authUser);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBe(JSON.stringify(authUser));
  });

  it('registers successfully without enabling the global 401 redirect', async () => {
    const api = createApiMock();
    vi.mocked(api.post).mockResolvedValue({
      data: {
        user: authUser,
      },
    });

    const store = createAuthStore({ api, persistUser: true });

    const register = store.getState().register;
    if (!register) {
      throw new Error('register is missing');
    }
    const result = await register('Student User', 'student@example.com', 'Password@123');

    expect(result).toBe(true);
    expect(api.post).toHaveBeenCalledWith(
      '/auth/register',
      {
        fullName: 'Student User',
        email: 'student@example.com',
        password: 'Password@123',
      },
      {
        skipUnauthorizedRedirect: true,
      },
    );
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().user).toEqual(authUser);
    expect(localStorage.getItem('token')).toBeNull();
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
