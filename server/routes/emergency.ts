import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Emergency Vault (Sensitive - strictly permission protected)
router.get('/:id/emergency', requirePermission('EMERGENCY_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const contacts = db.find('emergency_contacts', (c) => c.family_id === familyId);
  const profiles = db.find('emergency_profiles', (p) => p.family_id === familyId);

  const checklists = [
    {
      id: 'chk_home',
      title: 'Emergency at Home (Medical / Fire / Security)',
      steps: [
        'Call Emergency Services (112 or Ambulance 1066)',
        'Alert Primary Family Contact (Raj / Priya)',
        'Check Dadi Critical Allergy Card (No Penicillin!)',
        'Locate HDFC ERGO Cashless Health Card in Vault',
        'Head to nearest hospital (Apollo Jubilee Hills)',
      ],
    },
    {
      id: 'chk_travel',
      title: 'Emergency While Traveling',
      steps: [
        'Call Local Emergency Helpline (112)',
        'Contact Insurance TPA Desk (1800 2666)',
        'Share Live GPS Location via Family WhatsApp',
        'Access digital copies of ID and Vehicle RC from Vault',
      ],
    },
  ];

  logActivity(
    familyId,
    req.user!.id,
    req.user!.name,
    'Accessed Emergency Vault',
    'EMERGENCY',
    'Viewed family emergency profiles and contacts'
  );

  res.json({
    contacts,
    profiles,
    checklists,
  });
});

// Update Medical Profile
router.patch('/:id/emergency/profiles/:profileId', requirePermission('EMERGENCY_EDIT'), (req: AuthRequest, res) => {
  const { profileId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { blood_group, allergies, chronic_conditions, medications, primary_doctor, insurance_summary, special_instructions } = req.body;

  const updated = db.update(
    'emergency_profiles',
    (p) => p.id === profileId && p.family_id === familyId,
    {
      blood_group,
      allergies,
      chronic_conditions,
      medications,
      primary_doctor,
      insurance_summary,
      special_instructions,
      updated_at: new Date().toISOString(),
    }
  );

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Medical Profile', 'EMERGENCY', `Updated emergency medical card ${profileId}`);

  res.json(updated);
});

// Add Emergency Contact
router.post('/:id/emergency/contacts', requirePermission('EMERGENCY_EDIT'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { name, relationship, phone, secondary_phone, email, type, address, is_primary } = req.body;

  const newContact = {
    id: `emg_${Date.now()}`,
    family_id: familyId,
    name,
    relationship: relationship || 'Contact',
    phone,
    secondary_phone: secondary_phone || '',
    email: email || '',
    type: type || 'PERSONAL',
    address: address || '',
    is_primary: Boolean(is_primary),
    created_at: new Date().toISOString(),
  };

  db.insert('emergency_contacts', newContact);
  logActivity(familyId, req.user!.id, req.user!.name, 'Added Emergency Contact', 'EMERGENCY', `Added contact ${name} (${type})`);

  res.status(201).json(newContact);
});

export default router;
