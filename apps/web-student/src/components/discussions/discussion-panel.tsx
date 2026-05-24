'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useCreateDiscussionReply,
  useCreateDiscussionThread,
  useDiscussionThreads,
  useResolveDiscussionThread,
} from '@/hooks/use-discussions';
import { useAuthStore } from '@/features/auth/auth.store';
import { DiscussionTargetType, DiscussionThread } from '@/lib/discussion-api';

interface DiscussionPanelProps {
  targetType: DiscussionTargetType;
  lessonId?: string;
  exerciseSetId?: string;
}

export function DiscussionPanel({ targetType, lessonId, exerciseSetId }: DiscussionPanelProps) {
  const t = useTranslations('Student');
  const target = { targetType, lessonId, exerciseSetId };
  const { data, isLoading, isError } = useDiscussionThreads(target);
  const createThread = useCreateDiscussionThread(target);
  const createReply = useCreateDiscussionReply(target);
  const resolveThread = useResolveDiscussionThread(target);
  const currentUser = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const submitThread = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;

    createThread.mutate(
      { title: title.trim() || undefined, content: content.trim() },
      {
        onSuccess: () => {
          setTitle('');
          setContent('');
        },
      },
    );
  };

  const submitReply = (threadId: string) => {
    const reply = replyDrafts[threadId]?.trim();
    if (!reply) return;

    createReply.mutate(
      { threadId, content: reply },
      {
        onSuccess: () =>
          setReplyDrafts((current) => ({
            ...current,
            [threadId]: '',
          })),
      },
    );
  };

  return (
    <section className="mx-auto mb-10 w-full max-w-5xl px-4 sm:px-6 lg:px-10">
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t('discussion.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('discussion.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={submitThread} className="mb-6 space-y-3 rounded-md border bg-muted/20 p-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('discussion.titlePlaceholder')}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t('discussion.contentPlaceholder')}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!content.trim() || createThread.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createThread.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('discussion.postQuestion')}
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('discussion.loading')}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {t('discussion.loadError')}
          </div>
        ) : data?.data.length ? (
          <div className="space-y-4">
            {data.data.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                replyValue={replyDrafts[thread.id] ?? ''}
                replying={createReply.isPending}
                resolving={resolveThread.isPending}
                canResolve={
                  thread.author.id === currentUser?.id ||
                  currentUser?.role === 'ADMIN' ||
                  currentUser?.role === 'SUPER_ADMIN'
                }
                onReplyChange={(value) =>
                  setReplyDrafts((current) => ({ ...current, [thread.id]: value }))
                }
                onReplySubmit={() => submitReply(thread.id)}
                onResolve={() => resolveThread.mutate(thread.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
            {t('discussion.empty')}
          </div>
        )}
      </div>
    </section>
  );
}

function ThreadCard({
  thread,
  replyValue,
  replying,
  resolving,
  canResolve,
  onReplyChange,
  onReplySubmit,
  onResolve,
}: {
  thread: DiscussionThread;
  replyValue: string;
  replying: boolean;
  resolving: boolean;
  canResolve: boolean;
  onReplyChange: (value: string) => void;
  onReplySubmit: () => void;
  onResolve: () => void;
}) {
  const t = useTranslations('Student');

  return (
    <article className="rounded-md border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {thread.author.fullName}
          </p>
          {thread.title ? <h3 className="mt-1 text-base font-bold">{thread.title}</h3> : null}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {thread.content}
          </p>
        </div>
        {thread.isResolved ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('discussion.resolved')}
          </span>
        ) : canResolve ? (
          <button
            type="button"
            onClick={onResolve}
            disabled={resolving}
            className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            {t('discussion.resolve')}
          </button>
        ) : null}
      </div>

      {thread.replies.length > 0 ? (
        <div className="mt-4 space-y-3 border-l-2 border-primary/20 pl-4">
          {thread.replies.map((reply) => (
            <div key={reply.id}>
              <p className="text-xs font-semibold text-muted-foreground">{reply.author.fullName}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        <input
          value={replyValue}
          onChange={(event) => onReplyChange(event.target.value)}
          placeholder={t('discussion.replyPlaceholder')}
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={onReplySubmit}
          disabled={!replyValue.trim() || replying}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t('discussion.reply')}
        </button>
      </div>
    </article>
  );
}
