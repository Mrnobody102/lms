'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, User, Mail, Phone, Image as ImageIcon, Save } from 'lucide-react';
import { Button, Input, Label } from '@repo/ui';
import api from '@/lib/api';
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
      const response = await api.put('/users/me', {
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
      setError(Array.isArray(msg) ? msg[0] : (msg ?? t('settings.genericError')));
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
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder={t('settings.profile.fullNamePlaceholder')}
              className="h-10 rounded-md pl-10"
            />
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2 opacity-70">
          <Label>{t('settings.profile.email')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              value={user?.email || ''}
              disabled
              className="h-10 cursor-not-allowed rounded-md bg-muted/50 pl-10"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label>{t('settings.profile.phoneNumber')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('settings.profile.phonePlaceholder')}
              className="h-10 rounded-md pl-10"
            />
          </div>
        </div>

        {/* Avatar URL */}
        <div className="space-y-2">
          <Label>{t('settings.profile.avatar')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={t('settings.profile.avatarPlaceholder')}
              className="h-10 rounded-md pl-10"
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
