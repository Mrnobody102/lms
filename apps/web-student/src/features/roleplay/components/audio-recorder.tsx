'use client';

import { ChangeEvent, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { useSendAudioMessage } from '../api/use-roleplay';

export function AudioRecorder({ sessionId, disabled }: { sessionId: string; disabled?: boolean }) {
  const t = useTranslations('Student');
  const { uploadFile, isUploading } = useMediaUpload();
  const { mutate: sendAudio, isPending } = useSendAudioMessage();
  const [expectedText, setExpectedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError(t('roleplay.audioRequired'));
      return;
    }

    try {
      const uploaded = await uploadFile(selectedFile);
      sendAudio(
        {
          id: sessionId,
          mediaAssetId: uploaded.assetId,
          expectedText: expectedText.trim() || undefined,
          content: expectedText.trim() || undefined,
        },
        {
          onSuccess: () => {
            setSelectedFile(null);
            setExpectedText('');
          },
          onError: () => setError(t('roleplay.audioSendError')),
        },
      );
    } catch {
      setError(t('roleplay.audioUploadError'));
    }
  };

  const pending = disabled || isUploading || isPending;

  return (
    <div className="space-y-3 border-t bg-background p-4">
      <Input
        value={expectedText}
        onChange={(event) => setExpectedText(event.target.value)}
        placeholder={t('roleplay.expectedTextPlaceholder')}
        disabled={pending}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="audio/*" onChange={handleFileChange} disabled={pending} />
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={pending}
          className="gap-2"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {t('roleplay.sendAudio')}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
