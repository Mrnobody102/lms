import { ChatInterface } from '@/features/roleplay/components/chat-interface';
import { StudentNav } from '@/components/layout/student-nav';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

export default async function RoleplaySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getTranslations('Student')]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Link
          href="/roleplay"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('roleplay.backToDashboard')}
        </Link>
        <ChatInterface sessionId={id} />
      </main>
    </div>
  );
}
