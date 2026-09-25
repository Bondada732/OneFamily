import { getSupabaseClient } from '../db/supabaseClient.js';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileType?: string;
  sizeKb?: number;
}

/**
 * Ensure the requested bucket exists in Supabase Storage.
 * If not, create it as a public bucket.
 */
export async function ensureBucketExists(bucketName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      console.warn(`[Storage] Warning listing buckets: ${listErr.message}`);
    }

    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 25 * 1024 * 1024, // 25MB max
      });

      if (createErr && !createErr.message.includes('already exists')) {
        console.warn(`[Storage] Could not auto-create bucket ${bucketName}: ${createErr.message}`);
        return false;
      }
      console.log(`[Storage] Auto-created public bucket: ${bucketName}`);
    }
    return true;
  } catch (err: any) {
    console.warn(`[Storage] Exception verifying bucket ${bucketName}:`, err?.message || err);
    return false;
  }
}

/**
 * Upload a file Buffer directly to a Supabase Cloud Storage bucket.
 */
export async function uploadFileBuffer(
  bucketName: string,
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    await ensureBucketExists(bucketName);

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(`[Storage Upload Error] ${bucketName}/${filePath}:`, error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path || filePath);
    const publicUrl = urlData.publicUrl;

    return {
      success: true,
      url: publicUrl,
      fileName: filePath,
      fileType: contentType,
      sizeKb: Math.round(buffer.length / 1024),
    };
  } catch (err: any) {
    console.error(`[Storage Exception] ${bucketName}/${filePath}:`, err?.message || err);
    return { success: false, error: err?.message || 'Upload failed' };
  }
}

/**
 * Upload from Base64 Data URL (e.g. data:image/jpeg;base64,...)
 */
export async function uploadBase64DataUrl(
  bucketName: string,
  dataUrl: string,
  originalFileName: string,
  familyId?: string
): Promise<UploadResult> {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
    let contentType = 'application/octet-stream';
    let base64Data = dataUrl;

    if (matches && matches.length === 3) {
      contentType = matches[1];
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = originalFileName.includes('.')
      ? originalFileName.split('.').pop()
      : contentType.includes('pdf')
      ? 'pdf'
      : 'jpg';

    const cleanBaseName = originalFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const folder = familyId ? `${familyId}/` : '';
    const filePath = `${folder}${cleanBaseName}_${timestamp}_${randomSuffix}.${ext}`;

    return await uploadFileBuffer(bucketName, filePath, buffer, contentType);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Invalid base64 payload' };
  }
}
