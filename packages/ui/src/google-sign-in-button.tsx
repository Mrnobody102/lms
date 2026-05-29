'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      width?: number;
      locale?: string;
    },
  ): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

export interface GoogleSignInButtonProps {
  clientId?: string;
  locale?: string;
  label: string;
  loadingLabel: string;
  disabledLabel: string;
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError?: () => void;
  className?: string;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export function GoogleSignInButton({
  clientId,
  locale,
  label,
  loadingLabel,
  disabled = false,
  onCredential,
  onError,
  className,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptReady(true), { once: true });
      existingScript.addEventListener('error', () => onErrorRef.current?.(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => onErrorRef.current?.();
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) {
        setContainerWidth(width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!clientId || !scriptReady || !containerRef.current || disabled) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = '';
    window.google?.accounts?.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          onErrorRef.current?.();
          return;
        }

        setLoading(true);
        void Promise.resolve(onCredentialRef.current(response.credential)).finally(() =>
          setLoading(false),
        );
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    // GIS renderButton only accepts a pixel width (max 400, no percentages),
    // so we mirror the actual container width and clamp it to stay responsive
    // on narrow viewports.
    const width = containerWidth > 0 ? Math.min(Math.round(containerWidth), 400) : undefined;
    window.google?.accounts?.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width,
      locale,
    });
  }, [clientId, disabled, locale, scriptReady, containerWidth]);

  if (!clientId) {
    return null;
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'flex w-full items-center justify-center rounded-xl border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground',
          className,
        )}
      >
        {loading ? loadingLabel : label}
      </button>
    );
  }

  return (
    <div className={cn('relative flex min-h-11 w-full justify-center', className)}>
      <div ref={containerRef} aria-label={label} className="flex w-full justify-center" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 text-sm font-medium text-muted-foreground backdrop-blur-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingLabel}
        </div>
      )}
    </div>
  );
}
