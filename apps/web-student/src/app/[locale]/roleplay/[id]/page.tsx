'use client';

import { ChatInterface } from '@/features/roleplay/components/chat-interface';
import { StudentNav } from '@/components/layout/student-nav';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';

export default function RoleplaySessionPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Link
          href="/roleplay"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <ChatInterface sessionId={params.id} />
      </main>
    </div>
  );
}
