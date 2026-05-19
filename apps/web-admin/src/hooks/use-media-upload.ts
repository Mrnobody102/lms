import { useState } from 'react';
import axios from 'axios';
import { mediaApi, MediaAsset } from '../lib/media-api';

export interface UseMediaUploadResult {
  uploadFile: (file: File) => Promise<MediaAsset>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useMediaUpload(): UseMediaUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  const uploadFile = async (file: File): Promise<MediaAsset> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Get presigned URL from API
      const { assetId, uploadUrl } = await mediaApi.getPresignedUrl(
        file.name,
        file.type,
        file.size,
      );

      // 2. Upload directly to S3 using PUT and Axios
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentage);
          }
        },
      });

      // 3. Inform API that upload is complete
      const asset = await mediaApi.completeUpload(assetId);
      setIsUploading(false);
      return asset;
    } catch (err: unknown) {
      setIsUploading(false);
      const message = err instanceof Error ? err.message : 'Tải tập tin lên thất bại';
      setError(message);
      throw err;
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}
