'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@repo/ui';
import { Send, Loader2 } from 'lucide-react';
import { useBroadcastNotification } from '../../../hooks/use-notifications';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';

export default function NotificationsPage() {
  const t = useTranslations('Admin.notifications');
  const broadcastMutation = useBroadcastNotification();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'INFO' | 'WARNING' | 'SUCCESS'>('INFO');
  const [actionUrl, setActionUrl] = useState('');

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
          <div className="max-w-4xl mx-auto space-y-6">
            <AdminHeader title={t('title')} description={t('subtitle')} />

            <div className="bg-card rounded-xl border p-6">
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
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
