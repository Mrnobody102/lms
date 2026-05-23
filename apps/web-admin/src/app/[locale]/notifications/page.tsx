'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@repo/ui';
import { Send, Loader2 } from 'lucide-react';
import { useBroadcastNotification } from '../../../hooks/use-notifications';

export default function NotificationsPage() {
  const broadcastMutation = useBroadcastNotification();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'INFO' | 'WARNING' | 'SUCCESS'>('INFO');
  const [actionUrl, setActionUrl] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Validation Error: Title is required');
      return;
    }

    broadcastMutation.mutate(
      { title, content, type, actionUrl: actionUrl || undefined },
      {
        onSuccess: (data) => {
          alert(`Success: Sent notification to ${data.count} users`);
          setTitle('');
          setContent('');
          setType('INFO');
          setActionUrl('');
        },
        onError: () => {
          alert('Error: Failed to send notification');
        },
      },
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Broadcast announcements to all students.</p>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Send Broadcast</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This message will be sent to all active users in your tenant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., System Maintenance"
              disabled={broadcastMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'INFO' | 'WARNING' | 'SUCCESS')}
              disabled={broadcastMutation.isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="INFO">Information</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message Content (Optional)</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed message..."
              rows={4}
              disabled={broadcastMutation.isPending}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL (Optional)</Label>
            <Input
              id="actionUrl"
              type="url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="https://example.com/link"
              disabled={broadcastMutation.isPending}
            />
          </div>

          <Button type="submit" disabled={broadcastMutation.isPending} className="w-full sm:w-auto">
            {broadcastMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send to All Users
          </Button>
        </form>
      </div>
    </div>
  );
}
