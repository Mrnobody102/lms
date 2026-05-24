import { useState } from 'react';
import api from '@/lib/api';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

interface PresignedUploadResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
}

interface CompletedUploadResponse {
  id: string;
  url: string | null;
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File, options?: UploadOptions) => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. Request presigned URL
      const { data: presignedData } = await api.post<PresignedUploadResponse>(
        '/media/presigned-url',
        {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      );

      const { uploadUrl, assetId } = presignedData;

      // 2. Upload file directly to S3 using fetch or XMLHttpRequest
      // Using XMLHttpRequest for upload progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && options?.onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            options.onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      // 3. Mark upload as complete
      const { data: completeData } = await api.post<CompletedUploadResponse>(
        `/media/${assetId}/complete`,
      );

      if (!completeData.url) {
        throw new Error('Upload completed without a public URL');
      }

      return {
        url: completeData.url,
        assetId,
      };
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}
