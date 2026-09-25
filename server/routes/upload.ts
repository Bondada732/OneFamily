import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadBase64DataUrl } from '../services/storageService.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * POST /api/upload
 * Upload a file/photo to Supabase Cloud Storage.
 * Body: {
 *   fileData: string; // base64 data url
 *   fileName: string;
 *   bucket?: string; // 'famora-vault' | 'famora-memories' | 'famora-avatars'
 * }
 */
router.post('/', async (req: AuthRequest, res) => {
  const { fileData, fileName, bucket } = req.body;
  const familyId = req.familyId || 'fam_default';
  const user = req.user;

  if (!fileData) {
    return res.status(400).json({ error: 'No file data provided' });
  }

  const targetBucket = bucket || 'famora-vault';
  const safeFileName = fileName || `file_${Date.now()}`;

  try {
    const result = await uploadBase64DataUrl(targetBucket, fileData, safeFileName, familyId);

    if (!result.success || !result.url) {
      return res.status(500).json({
        error: result.error || 'Failed to upload file to cloud storage',
      });
    }

    if (user) {
      logActivity(
        familyId,
        user.id,
        user.name,
        'Cloud File Upload',
        'STORAGE',
        `Uploaded file "${safeFileName}" to ${targetBucket}`
      );
    }

    return res.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      fileType: result.fileType,
      sizeKb: result.sizeKb,
    });
  } catch (err: any) {
    console.error('[Upload Route Exception]:', err);
    return res.status(500).json({ error: err?.message || 'Server error uploading file' });
  }
});

export default router;
