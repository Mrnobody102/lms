import api from './api';

export interface PresignedUrlResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
}

export interface MediaAsset {
  id: string;
  tenantId: string;
  userId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url?: string;
  status: 'UPLOADING' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export const mediaApi = {
  getPresignedUrl(filename: string, mimeType: string, sizeBytes: number) {
    return api
      .post('/media/presigned-url', { filename, mimeType, sizeBytes })
      .then((r) => r.data as PresignedUrlResponse);
  },

  completeUpload(assetId: string) {
    return api.post(`/media/${assetId}/complete`).then((r) => r.data as MediaAsset);
  },
};
