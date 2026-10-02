import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

let blobServiceClient: BlobServiceClient | null = null;

if (AZURE_STORAGE_CONNECTION_STRING) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    console.log('⚡ Azure Blob Storage Client initialized.');
  } catch (err) {
    console.error('⚠️ Failed to initialize Azure Blob Storage client:', err);
    blobServiceClient = null;
  }
}

export function isAzureStorageConfigured(): boolean {
  return blobServiceClient !== null;
}

export interface AzureUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileType?: string;
  sizeKb?: number;
}

/**
 * Ensure the requested container exists in Azure Blob Storage with public blob access.
 */
export async function ensureContainerExists(containerName: string): Promise<boolean> {
  if (!blobServiceClient) return false;

  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob', // Allows public read access for blobs
      });
      console.log(`[Azure Storage] Created public container: ${containerName}`);
    }
    return true;
  } catch (err: any) {
    console.warn(`[Azure Storage] Exception verifying container ${containerName}:`, err.message);
    return false;
  }
}

/**
 * Upload a file Buffer directly to Azure Blob Storage
 */
export async function uploadBufferToAzureBlob(
  containerName: string,
  blobPath: string,
  buffer: Buffer,
  contentType: string
): Promise<AzureUploadResult> {
  if (!blobServiceClient) {
    return { success: false, error: 'Azure Blob Storage is not configured' };
  }

  try {
    await ensureContainerExists(containerName);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = blockBlobClient.url;
    return {
      success: true,
      url: publicUrl,
      fileName: blobPath,
      fileType: contentType,
      sizeKb: Math.round(buffer.length / 1024),
    };
  } catch (err: any) {
    console.error(`[Azure Storage Error] ${containerName}/${blobPath}:`, err.message);
    return { success: false, error: err.message || 'Upload failed' };
  }
}

/**
 * Upload Base64 Data URL to Azure Blob Storage
 */
export async function uploadBase64ToAzureBlob(
  containerName: string,
  dataUrl: string,
  originalFileName: string,
  familyId?: string
): Promise<AzureUploadResult> {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
    let contentType = 'application/octet-stream';
    let base64Data = dataUrl;

    if (matches && matches.length === 3) {
      contentType = matches[1];
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = contentType.split('/')[1] || 'jpg';
    const cleanFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);

    const blobName = `${cleanFileName}_${timestamp}_${randomSuffix}.${ext}`;
    const fullPath = familyId ? `${familyId}/${blobName}` : blobName;

    return await uploadBufferToAzureBlob(containerName, fullPath, buffer, contentType);
  } catch (err: any) {
    console.error('[Azure Storage Base64 Upload Exception]:', err);
    return { success: false, error: err?.message || 'Failed to process base64 file' };
  }
}
