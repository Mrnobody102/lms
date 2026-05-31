import { mediaApi } from './media-api';

export async function uploadMediaFile(file: File): Promise<{ url: string }> {
  const presigned = await mediaApi.getPresignedUrl(file.name, file.type, file.size);

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Upload failed');
  }

  const asset = await mediaApi.completeUpload(presigned.assetId);
  if (!asset.url) {
    throw new Error('Uploaded asset does not have a public URL');
  }

  return { url: asset.url };
}
