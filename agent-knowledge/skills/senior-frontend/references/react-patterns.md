# Senior Frontend: React Patterns

## Compound Components

```tsx
// components/Tabs/Tabs.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  active: number;
  setActive: (index: number) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  children: ReactNode;
  defaultIndex?: number;
}

export function Tabs({ children, defaultIndex = 0 }: TabsProps) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="tabs-list" role="tablist">
      {children}
    </div>
  );
};

Tabs.Tab = function Tab({ index, children }: { index: number; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab must be inside Tabs');
  return (
    <button role="tab" aria-selected={ctx.active === index} onClick={() => ctx.setActive(index)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ index, children }: { index: number; children: ReactNode }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Panel must be inside Tabs');
  return ctx.active === index ? <div role="tabpanel">{children}</div> : null;
};
```

## Custom Hooks

```tsx
// hooks/useDebounce.ts
'use client';

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

```tsx
// hooks/useLocalStorage.ts
'use client';

import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
    setValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [value, setStoredValue] as const;
}
```

## Render Props

```tsx
// components/AsyncData.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AsyncDataProps<T> {
  url: string;
  children: (data: { data: T | null; loading: boolean; error: string | null }) => ReactNode;
}

export function AsyncData<T>({ url, children }: AsyncDataProps<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err.message }));
  }, [url]);

  return <>{children(state)}</>;
}
```

## Zustand Store Pattern

```typescript
// features/auth/auth.store.ts
import { createAuthStore } from '@repo/shared';
import api from '../../lib/api';

export const useAuthStore = createAuthStore({
  api,
  persistUser: true,
});
```

LMS auth is cookie-backed. Zustand may persist safe user data for UX hydration, but it must not persist JWTs or tenant authority.

## Tailwind Glassmorphism Pattern

```css
/* globals.css */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

```tsx
// Glass card component
<div className="glass rounded-xl p-6 shadow-lg">
  <h2 className="text-white font-semibold">{title}</h2>
</div>
```

## Conditional Classes

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Usage
<button
  className={cn(
    'px-4 py-2 rounded-lg font-medium transition-colors',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700',
    disabled && 'opacity-50 cursor-not-allowed',
  )}
/>;
```
