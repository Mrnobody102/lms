'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useCreateProgram } from '@/hooks/use-programs';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button, Input, Label } from '@/components/ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from '@/navigation';

export default function NewProgramPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const createProgram = useCreateProgram();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProgram.mutateAsync({
        title,
        description,
        isActive: true,
      });
      router.push('/programs');
    } catch (error) {
      console.error('Failed to create program:', error);
      alert(t('errorCreatingProgram'));
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
              <Link href="/programs">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('createProgram')}</h1>
                <p className="text-sm text-muted-foreground">{t('createProgramDesc')}</p>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('title')}</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder={t('programTitlePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDescription(e.target.value)
                    }
                    placeholder={t('programDescPlaceholder')}
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Link href="/programs">
                    <Button type="button" variant="outline">
                      {t('cancel')}
                    </Button>
                  </Link>
                  <Button type="submit" disabled={createProgram.isPending || !title.trim()}>
                    {createProgram.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('create')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
