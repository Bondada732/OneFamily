import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// Get Memories, Voice Notes & Yearbook
router.get('/:id/memories', requirePermission('MEMORY_VIEW'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const memories = db.find('memories', (m) => m.family_id === familyId);
  const voiceMemories = db.find('voice_memories', (v) => v.family_id === familyId);

  const formattedMemories = memories.map((m) => ({
    ...m,
    photosList: typeof m.photos === 'string' ? JSON.parse(m.photos || '[]') : m.photos,
    taggedMembersList: typeof m.tagged_members === 'string' ? JSON.parse(m.tagged_members || '[]') : m.tagged_members,
  }));

  res.json({
    memories: formattedMemories,
    voiceMemories,
  });
});

// Add New Memory / Photo Story
router.post('/:id/memories', requirePermission('MEMORY_UPLOAD'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { title, date, location, album, description, photos, tagged_members } = req.body;

  const newMemory = {
    id: `mem_${Date.now()}`,
    family_id: familyId,
    title,
    date: date || new Date().toISOString().split('T')[0],
    location: location || '',
    album: album || 'Family Moments',
    description: description || '',
    photos: JSON.stringify(photos || ['https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800']),
    tagged_members: JSON.stringify(tagged_members || [req.user!.name]),
    created_at: new Date().toISOString(),
  };

  db.insert('memories', newMemory);
  logActivity(familyId, req.user!.id, req.user!.name, 'Added Family Memory', 'MEMORY', `Saved memory "${title}"`);

  res.status(201).json(newMemory);
});

// Update Memory
router.patch('/:id/memories/:memId', requirePermission('MEMORY_UPLOAD'), (req: AuthRequest, res) => {
  const { memId } = req.params;
  const familyId = req.params.id || req.familyId!;
  const { title, date, location, album, description, photos, tagged_members } = req.body;

  const existing = db.findOne('memories', (m) => m.id === memId && m.family_id === familyId);
  if (!existing) return res.status(404).json({ error: 'Memory not found' });

  const updated = db.update('memories', (m) => m.id === memId && m.family_id === familyId, {
    title: title ?? existing.title,
    date: date ?? existing.date,
    location: location ?? existing.location,
    album: album ?? existing.album,
    description: description ?? existing.description,
    photos: photos ? JSON.stringify(photos) : existing.photos,
    tagged_members: tagged_members ? JSON.stringify(tagged_members) : existing.tagged_members,
    updated_at: new Date().toISOString(),
  });

  logActivity(familyId, req.user!.id, req.user!.name, 'Updated Family Memory', 'MEMORY', `Updated memory "${title || existing.title}"`);
  res.json(updated[0] || existing);
});

// Delete Memory
router.delete('/:id/memories/:memId', requirePermission('MEMORY_DELETE'), (req: AuthRequest, res) => {
  const { memId } = req.params;
  const familyId = req.params.id || req.familyId!;

  const existing = db.findOne('memories', (m) => m.id === memId && m.family_id === familyId);
  const deleted = db.delete('memories', (m) => m.id === memId && m.family_id === familyId);
  if (deleted && existing) {
    logActivity(familyId, req.user!.id, req.user!.name, 'Deleted Family Memory', 'MEMORY', `Removed memory "${existing.title}"`);
  }

  res.json({ success: deleted });
});

// Add Grandparent Voice Memory
router.post('/:id/voice-memories', requirePermission('MEMORY_UPLOAD'), (req: AuthRequest, res) => {
  const familyId = req.params.id || req.familyId!;
  const { speaker_name, speaker_relationship, title, transcript, translation_hindi, translation_telugu, duration_seconds } = req.body;

  const newVoice = {
    id: `vm_${Date.now()}`,
    family_id: familyId,
    speaker_name: speaker_name || 'Grandmother',
    speaker_relationship: speaker_relationship || 'Grandparent',
    title: title || 'Family Story & Wisdom',
    date: new Date().toISOString().split('T')[0],
    audio_url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_park.ogg',
    duration_seconds: Number(duration_seconds) || 120,
    transcript: transcript || 'Cherish your family roots, support one another through all seasons of life.',
    translation_hindi: translation_hindi || 'अपने पारिवारिक जड़ों को संजोएं, जीवन के हर मौसम में एक-दूसरे का समर्थन करें।',
    translation_telugu: translation_telugu || 'మీ కుటుంబ మూలాలను గౌరవించండి, జీవితంలోని అన్ని కాలాలలో ఒకరికొకరు మద్దతు ఇవ్వండి.',
    created_at: new Date().toISOString(),
  };

  db.insert('voice_memories', newVoice);
  logActivity(familyId, req.user!.id, req.user!.name, 'Recorded Voice Memory', 'MEMORY', `Saved voice story "${title}" from ${newVoice.speaker_name}`);

  res.status(201).json(newVoice);
});

// Generate Annual Family Yearbook Preview (2026)
router.get('/:id/yearbook/:year', requirePermission('MEMORY_VIEW'), (req: AuthRequest, res) => {
  const { year } = req.params;
  const familyId = req.params.id || req.familyId!;

  const yearbook = {
    year: year || '2026',
    title: `Our Family Story — ${year || '2026'}`,
    coverPhoto: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1000',
    highlightsCount: 24,
    milestones: [
      { month: 'January', title: 'New Year Resolution & Emergency Fund 60% Milestone' },
      { month: 'May', title: 'Goa Summer Road Trip & Sunset at Palolem Beach' },
      { month: 'September', title: "Mom's Birthday & Aarav 9th Grade Science Olympiad" },
      { month: 'November', title: 'Diwali 50 Diyas Celebration & Dadi Storytelling' },
    ],
    topTrips: ['Goa Summer Getaway', 'Weekend Drive to Ananthagiri Hills'],
    familyGrowthMetrics: {
      tasksCompleted: 142,
      goalsProgressed: '₹4.5L added to savings',
      memoriesPreserved: 38,
      voiceStoriesRecorded: 4,
    },
  };

  res.json(yearbook);
});

export default router;
