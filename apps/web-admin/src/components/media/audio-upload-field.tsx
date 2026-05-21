'use client';

import { Loader2, Upload, X, Volume2 } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/ui';
import { mediaApi } from '@/lib/media-api';

interface Props {
  assetId: string | null;
  audioUrl: string | null;
  replayLimit: number | null;
  onChange: (data: {
    assetId: string | null;
    audioUrl: string | null;
    replayLimit: number | null;
  }) => void;
  disabled?: boolean;
}

export function AudioUploadField({ assetId, audioUrl, replayLimit, onChange, disabled }: Props) {
  const t = useTranslations('Admin.questionAudio');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const presigned = await mediaApi.getPresignedUrl(file.name, file.type, file.size);
      const uploadResponse = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      const asset = await mediaApi.completeUpload(presigned.assetId);
      onChange({ assetId: presigned.assetId, audioUrl: asset.url ?? null, replayLimit });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadError'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange({ assetId: null, audioUrl: null, replayLimit: null });
  };

  const handleReplayLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    if (!value) {
      onChange({ assetId, audioUrl, replayLimit: null });
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
      onChange({ assetId, audioUrl, replayLimit: parsed });
    }
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Volume2 className="h-4 w-4" />
        {t('label')}
      </div>

      {assetId && audioUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <audio src={audioUrl} controls className="w-full max-w-md">
            <track kind="captions" />
          </audio>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {t('change')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              {t('remove')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                {t('uploading')}
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1" />
                {t('attach')}
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">{t('hint')}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleSelect}
        disabled={disabled || uploading}
      />

      {assetId ? (
        <div className="space-y-1">
          <Label htmlFor="replay-limit" className="text-xs">
            {t('replayLimitLabel')}
          </Label>
          <Input
            id="replay-limit"
            type="number"
            min={1}
            max={20}
            placeholder={t('replayLimitPlaceholder')}
            value={replayLimit ?? ''}
            onChange={handleReplayLimitChange}
            disabled={disabled || uploading}
            className="max-w-[180px]"
          />
          <p className="text-xs text-muted-foreground">{t('replayLimitHint')}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
