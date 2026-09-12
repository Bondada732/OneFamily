import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { extractDocumentData } from '../services/ocrService.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Documents in Vault
router.get('/:id/documents', requirePermission('DOCUMENT_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const documents = db.find('documents', (d) => d.family_id === familyId);
  const categories = db.getTable('document_categories');

  // Compute expiry alerts
  const today = new Date();
  const enrichedDocs = documents.map((doc) => {
    let daysUntilExpiry: number | null = null;
    let expiryStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' = 'VALID';

    if (doc.expiry_date) {
      const expDate = new Date(doc.expiry_date);
      const diffMs = expDate.getTime() - today.getTime();
      daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) expiryStatus = 'EXPIRED';
      else if (daysUntilExpiry <= 45) expiryStatus = 'EXPIRING_SOON';
    }

    return {
      ...doc,
      daysUntilExpiry,
      expiryStatus,
    };
  });

  res.json({
    documents: enrichedDocs,
    categories,
    expiringCount: enrichedDocs.filter((d) => d.expiryStatus === 'EXPIRING_SOON' || d.expiryStatus === 'EXPIRED').length,
  });
});

// Scan Document with OCR Intelligence
router.post('/:id/documents/scan-ocr', requirePermission('DOCUMENT_UPLOAD'), (req: AuthRequest, res) => {
  const { fileName, categoryHint } = req.body;
  const extracted = extractDocumentData(fileName || 'document.pdf', categoryHint);

  res.json({
    extracted,
    message: 'AI Document analysis complete. Extracted key metadata for verification.',
  });
});

// Upload / Add Document
router.post('/:id/documents', requirePermission('DOCUMENT_UPLOAD'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, category_id, owner_name, document_number, issue_date, expiry_date, issuer, file_url, file_type, tags, notes, auto_create_reminder } = req.body;

  const newDoc = {
    id: `doc_${Date.now()}`,
    family_id: familyId,
    uploaded_by_id: req.user!.id,
    owner_name: owner_name || req.user!.name,
    title,
    category_id: category_id || 'doc_identity',
    document_number: document_number || '',
    issue_date: issue_date || '',
    expiry_date: expiry_date || '',
    issuer: issuer || 'Authorized Entity',
    file_url: file_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    file_type: file_type || 'PDF',
    file_size_kb: Math.floor(500 + Math.random() * 2000),
    tags: tags || '',
    notes: notes || '',
    ocr_extracted_text: `Extracted verification for ${title}`,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  db.insert('documents', newDoc);

  // Auto-create renewal reminder if requested and expiry exists
  if (auto_create_reminder && expiry_date) {
    db.insert('reminders', {
      id: `rem_doc_${Date.now()}`,
      family_id: familyId,
      title: `${title} Renewal Deadline`,
      due_date: expiry_date,
      category: 'DOCUMENT',
      lead_days: 30,
      is_dismissed: false,
      linked_entity_type: 'DOCUMENT',
      linked_entity_id: newDoc.id,
      created_at: new Date().toISOString(),
    });
  }

  logActivity(familyId, req.user!.id, req.user!.name, 'Uploaded Document', 'DOCUMENT', `Uploaded "${title}" to Vault`);

  res.status(201).json(newDoc);
});

// Delete Document
router.delete('/:id/documents/:docId', requirePermission('DOCUMENT_DELETE'), (req: AuthRequest, res) => {
  const { docId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const deleted = db.delete('documents', (d) => d.id === docId && d.family_id === familyId);
  if (deleted) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Document', 'DOCUMENT', `Removed document ${docId} from Vault`);
  }

  res.json({ success: deleted });
});

export default router;
