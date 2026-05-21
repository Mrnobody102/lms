'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, User, Mail, Phone, Image as ImageIcon, Save } from 'lucide-react';
import { Button, Input, Label } from '@repo/ui';
import { defaultApiClient } from '@repo/api-client';
import { useAuthStore } from '../../auth/auth.store';

export function ProfileForm() {
  const t = useTranslations('Admin');
  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
    }
    setIsHydrated(true);
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isHydrated) {
    return null; // Or a loading skeleton
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await defaultApiClient.put('/users/me', {
        fullName,
        phoneNumber: phoneNumber || null,
        avatarUrl: avatarUrl || null,
      });

      // Update local store with new user data
      if (setUser) {
        setUser(response.data);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {t('settings.profile.updateSuccess')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label>{t('settings.profile.fullName')}</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Nguyen Van A"
              className="pl-10"
            />
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2 opacity-70">
          <Label>{t('settings.profile.email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={user?.email || ''}
              disabled
              className="pl-10 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label>{t('settings.profile.phoneNumber')}</Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+84..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Avatar URL */}
        <div className="space-y-2">
          <Label>{t('settings.profile.avatar')}</Label>
          <div className="relative">
            <ImageIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('settings.profile.updating')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('settings.profile.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
