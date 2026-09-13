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

// Create Medical Profile
router.post('/:id/emergency/profiles', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { full_name, user_id, blood_group, allergies, chronic_conditions, medications, primary_doctor, insurance_summary, special_instructions } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'Full name is required for medical profile' });
  }

  const newProfile = {
    id: `med_${Date.now()}`,
    family_id: familyId,
    user_id: user_id || null,
    full_name,
    blood_group: blood_group || 'O+',
    allergies: allergies || '',
    chronic_conditions: chronic_conditions || '',
    medications: medications || '',
    primary_doctor: primary_doctor || '',
    insurance_summary: insurance_summary || '',
    special_instructions: special_instructions || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.insert('emergency_profiles', newProfile);
  logActivity(familyId, req.user!.id, req.user!.name, 'Created Medical Profile', 'EMERGENCY', `Added emergency medical profile for ${full_name}`);

  res.status(201).json(newProfile);
});

// Update Medical Profile
router.patch('/:id/emergency/profiles/:profileId', (req: AuthRequest, res) => {
  const { profileId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { full_name, blood_group, allergies, chronic_conditions, medications, primary_doctor, insurance_summary, special_instructions } = req.body;

  const existing = db.findOne('emergency_profiles', (p) => p.id === profileId && p.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Medical profile not found' });
  }

  const updated = db.update(
    'emergency_profiles',
    (p) => p.id === profileId && p.family_id === familyId,
    {
      full_name: full_name !== undefined ? full_name : existing.full_name,
      blood_group: blood_group !== undefined ? blood_group : existing.blood_group,
      allergies: allergies !== undefined ? allergies : existing.allergies,
      chronic_conditions: chronic_conditions !== undefined ? chronic_conditions : existing.chronic_conditions,
      medications: medications !== undefined ? medications : existing.medications,
      primary_doctor: primary_doctor !== undefined ? primary_doctor : existing.primary_doctor,
      insurance_summary: insurance_summary !== undefined ? insurance_summary : existing.insurance_summary,
      special_instructions: special_instructions !== undefined ? special_instructions : existing.special_instructions,
      updated_at: new Date().toISOString(),
    }
  );

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Medical Profile', 'EMERGENCY', `Updated emergency medical card for ${existing.full_name}`);

  res.json(updated);
});

// Delete Medical Profile
router.delete('/:id/emergency/profiles/:profileId', (req: AuthRequest, res) => {
  const { profileId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('emergency_profiles', (p) => p.id === profileId && p.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Medical profile not found' });
  }

  db.delete('emergency_profiles', (p) => p.id === profileId && p.family_id === familyId);
  logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Medical Profile', 'EMERGENCY', `Deleted medical profile for ${existing.full_name}`);

  res.json({ success: true, message: 'Medical profile deleted successfully' });
});

// Add Emergency Contact
router.post('/:id/emergency/contacts', (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { name, relationship, phone, secondary_phone, email, type, address, is_primary } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required' });
  }

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

// Update Emergency Contact
router.patch('/:id/emergency/contacts/:contactId', (req: AuthRequest, res) => {
  const { contactId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { name, relationship, phone, secondary_phone, email, type, address, is_primary } = req.body;

  const existing = db.findOne('emergency_contacts', (c) => c.id === contactId && c.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Emergency contact not found' });
  }

  const updated = db.update(
    'emergency_contacts',
    (c) => c.id === contactId && c.family_id === familyId,
    {
      name: name !== undefined ? name : existing.name,
      relationship: relationship !== undefined ? relationship : existing.relationship,
      phone: phone !== undefined ? phone : existing.phone,
      secondary_phone: secondary_phone !== undefined ? secondary_phone : existing.secondary_phone,
      email: email !== undefined ? email : existing.email,
      type: type !== undefined ? type : existing.type,
      address: address !== undefined ? address : existing.address,
      is_primary: is_primary !== undefined ? Boolean(is_primary) : existing.is_primary,
      updated_at: new Date().toISOString(),
    }
  );

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Emergency Contact', 'EMERGENCY', `Updated contact ${existing.name}`);

  res.json(updated);
});

// Delete Emergency Contact
router.delete('/:id/emergency/contacts/:contactId', (req: AuthRequest, res) => {
  const { contactId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('emergency_contacts', (c) => c.id === contactId && c.family_id === familyId);
  if (!existing) {
    return res.status(404).json({ error: 'Emergency contact not found' });
  }

  db.delete('emergency_contacts', (c) => c.id === contactId && c.family_id === familyId);
  logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Emergency Contact', 'EMERGENCY', `Deleted emergency contact ${existing.name}`);

  res.json({ success: true, message: 'Emergency contact deleted successfully' });
});

export default router;
