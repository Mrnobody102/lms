'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  LogOut,
  Clock,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { defaultApiClient } from '@repo/api-client';
import { Button, Badge } from '@repo/ui';

interface Session {
  id: string;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  device: {
    vendor: string;
    model: string;
    type: string;
  };
  os: {
    name: string;
    version: string;
  };
  browser: {
    name: string;
    version: string;
  };
  isCurrent: boolean;
}

export function SessionManager() {
  const t = useTranslations('settings.sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await defaultApiClient.get<Session[]>('/user-sessions/me');
      setSessions(response.data);
    } catch (_error) {
      console.error('Failed to fetch sessions:', _error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      setRevokingId(id);
      setMessage(null);
      await defaultApiClient.delete(`/user-sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setMessage({ type: 'success', text: t('revokeSuccess') });
    } catch (_error) {
      setMessage({ type: 'error', text: t('revokeError') });
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatOS = (session: Session) => {
    if (session.os.name !== 'Unknown') {
      return `${session.os.name} ${session.os.version}`;
    }
    return t('unknownOS');
  };

  const formatBrowser = (session: Session) => {
    if (session.browser.name !== 'Unknown') {
      return `${session.browser.name} ${session.browser.version}`;
    }
    return t('unknownBrowser');
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{t('title')}</h2>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border bg-card/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{t('title')}</h2>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="mb-6 text-sm text-muted-foreground">{t('description')}</p>

        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm ${
              message.type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-500'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="group flex flex-col gap-4 rounded-xl border border-border/50 bg-card/30 p-4 transition-all hover:border-primary/30 hover:bg-card/50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  {getDeviceIcon(session.device.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {formatBrowser(session)} on {formatOS(session)}
                    </span>
                    {session.isCurrent && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        {t('currentDevice')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {session.ipAddress || 'Unknown IP'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t('lastActive')}: {new Date(session.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokingId === session.id}
                  onClick={() => handleRevoke(session.id)}
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                >
                  {revokingId === session.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  {t('revoke')}
                </Button>
              )}
            </div>
          ))}

          {sessions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Info className="mb-2 h-12 w-12 opacity-20" />
              <p>No active sessions found.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
