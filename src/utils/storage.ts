import { apiRequest } from './api.js';

export type StorageBucket = 'famora-vault' | 'famora-memories' | 'famora-avatars';

export interface CloudUploadResponse {
  success: boolean;
  url: string;
  fileName?: string;
  fileType?: string;
  sizeKb?: number;
  error?: string;
}

/**
 * Upload a File object or Base64 data URL to Supabase Cloud Storage.
 * Returns the permanent public CDN URL accessible across all family devices.
 */
export async function uploadFileToCloud(
  fileOrDataUrl: File | string,
  bucket: StorageBucket = 'famora-vault',
  customFileName?: string
): Promise<CloudUploadResponse> {
  try {
    let base64Data: string;
    let fileName = customFileName || `upload_${Date.now()}`;

    if (fileOrDataUrl instanceof File) {
      fileName = customFileName || fileOrDataUrl.name;
      base64Data = await readFileAsBase64(fileOrDataUrl);
    } else {
      base64Data = fileOrDataUrl;
    }

    const response = await apiRequest<CloudUploadResponse>('/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileData: base64Data,
        fileName,
        bucket,
      }),
    });

    return response;
  } catch (err: any) {
    console.error('[Cloud Upload Failed]:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Failed to upload to cloud storage',
    };
  }
}

/**
 * Helper to convert a browser File to base64 Data URL
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
