'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Label } from '@repo/ui';
import { Send, Loader2, Clock, FileText } from 'lucide-react';
import { useBroadcastNotification } from '../../../hooks/use-notifications';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';

type BroadcastHistoryItem = {
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  actionUrl: string;
  sentAt: string;
};

export default function NotificationsPage() {
  const t = useTranslations('Admin.notifications');
  const broadcastMutation = useBroadcastNotification();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'INFO' | 'WARNING' | 'SUCCESS'>('INFO');
  const [actionUrl, setActionUrl] = useState('');

  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('broadcast_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = (item: BroadcastHistoryItem) => {
    const updated = [item, ...history].slice(0, 5); // Keep last 5
    setHistory(updated);
    try {
      localStorage.setItem('broadcast_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const templates = [
    {
      title: t('templateSystemTitle'),
      content: t('templateSystemDesc'),
      type: 'WARNING' as const,
    },
    {
      title: t('templateReminderTitle'),
      content: t('templateReminderDesc'),
      type: 'INFO' as const,
    },
    {
      title: t('templateNewFeatureTitle'),
      content: t('templateNewFeatureDesc'),
      type: 'SUCCESS' as const,
    },
  ];

  const applyTemplate = (item: {
    title: string;
    content: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS';
    actionUrl?: string;
  }) => {
    setTitle(item.title);
    setContent(item.content || '');
    setType(item.type);
    setActionUrl(item.actionUrl || '');
    toast.success(t('useTemplate'));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('validation.titleRequired'));
      return;
    }

    broadcastMutation.mutate(
      { title, content, type, actionUrl: actionUrl.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success(t('validation.success', { count: data.count }));
          saveHistory({
            title,
            content,
            type,
            actionUrl: actionUrl.trim(),
            sentAt: new Date().toISOString(),
          });
          setTitle('');
          setContent('');
          setType('INFO');
          setActionUrl('');
        },
        onError: () => {
          toast.error(t('validation.error'));
        },
      },
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <AdminHeader title={t('title')} description={t('subtitle')} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
              <div className="bg-card rounded-xl border p-6 h-fit">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">{t('sendBroadcast')}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t('sendBroadcastDesc')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('form.titleLabel')}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('form.titlePlaceholder')}
                      disabled={broadcastMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{t('form.typeLabel')}</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'INFO' | 'WARNING' | 'SUCCESS')}
                      disabled={broadcastMutation.isPending}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="INFO">{t('form.typeInfo')}</option>
                      <option value="SUCCESS">{t('form.typeSuccess')}</option>
                      <option value="WARNING">{t('form.typeWarning')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">{t('form.contentLabel')}</Label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t('form.contentPlaceholder')}
                      rows={4}
                      disabled={broadcastMutation.isPending}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actionUrl">{t('form.actionUrlLabel')}</Label>
                    <Input
                      id="actionUrl"
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder={t('form.actionUrlPlaceholder')}
                      disabled={broadcastMutation.isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={broadcastMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {broadcastMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {t('form.sendBtn')}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="bg-card rounded-xl border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('templatesTitle')}</h3>
                  </div>
                  <div className="space-y-3">
                    {templates.map((tpl, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => applyTemplate(tpl)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{tpl.title}</p>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {tpl.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t('historyTitle')}</h3>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noHistory')}</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item, i) => (
                        <div
                          key={i}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => applyTemplate(item)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate pr-2">{item.title}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(item.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.content || '...'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
