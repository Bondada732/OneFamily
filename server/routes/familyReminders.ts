import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import {
  calculateOccasionStatus,
  canUserViewContact,
  getActiveFamilyOccasionReminders,
} from '../services/reminderEngine.js';

const router = express.Router();
router.use(authMiddleware);

// 1. Get all family contacts with their occasions (filtered by user's permissions)
router.get('/:familyId/contacts', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const user = req.user!;

    const contacts = db.find(
      'family_contacts',
      (c) => c.family_id === familyId && c.is_active !== false
    );
    const occasions = db.find(
      'family_contact_occasions',
      (o) => o.family_id === familyId && o.is_active !== false
    );
    const permissions = db.find('contact_permissions', () => true);

    const enrichedContacts = [];

    for (const contact of contacts) {
      const perm = canUserViewContact(contact, user, permissions);
      if (!perm.canView) continue;

      const contactOccasions = occasions
        .filter((o) => o.contact_id === contact.id)
        .map((occ) => {
          const calc = calculateOccasionStatus(contact, occ);
          return {
            ...occ,
            calculation: calc,
          };
        });

      enrichedContacts.push({
        ...contact,
        mobile_number: perm.canViewPhone ? contact.mobile_number : '',
        notes: perm.canViewNotes ? contact.notes : '',
        can_edit: perm.canEdit,
        can_view_phone: perm.canViewPhone,
        can_view_notes: perm.canViewNotes,
        occasions: contactOccasions,
      });
    }

    res.json(enrichedContacts);
  } catch (err: any) {
    console.error('Error fetching family contacts:', err);
    res.status(500).json({ error: 'Failed to fetch family contacts' });
  }
});

// 2. Get active dashboard occasion reminders (Today + Upcoming in active window)
router.get('/:familyId/dashboard-active', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const user = req.user!;

    const dbStore = {
      families: db.getTable('families'),
      users: db.getTable('users'),
      permissions: db.getTable('permissions'),
      member_permissions: db.getTable('member_permissions'),
      devices: db.getTable('devices'),
      audit_logs: db.getTable('audit_logs'),
      expense_categories: db.getTable('expense_categories'),
      expenses: db.getTable('expenses'),
      budgets: db.getTable('budgets'),
      investments: db.getTable('investments'),
      insurance_policies: db.getTable('insurance_policies'),
      liabilities: db.getTable('liabilities'),
      goals: db.getTable('goals'),
      calendar_events: db.getTable('calendar_events'),
      reminders: db.getTable('reminders'),
      document_categories: db.getTable('document_categories'),
      documents: db.getTable('documents'),
      emergency_contacts: db.getTable('emergency_contacts'),
      emergency_profiles: db.getTable('emergency_profiles'),
      memories: db.getTable('memories'),
      voice_memories: db.getTable('voice_memories'),
      tasks: db.getTable('tasks'),
      grocery_items: db.getTable('grocery_items'),
      maintenance_items: db.getTable('maintenance_items'),
      notifications: db.getTable('notifications'),
      ai_conversations: db.getTable('ai_conversations'),
      detected_transactions: db.getTable('detected_transactions'),
      merchant_aliases: db.getTable('merchant_aliases'),
      merchant_preferences: db.getTable('merchant_preferences'),
      smart_capture_settings: db.getTable('smart_capture_settings'),
      family_contacts: db.getTable('family_contacts'),
      family_contact_occasions: db.getTable('family_contact_occasions'),
      reminder_settings: db.getTable('reminder_settings'),
      contact_permissions: db.getTable('contact_permissions'),
    };

    const activeReminders = getActiveFamilyOccasionReminders(familyId, user, dbStore);

    const todayOccasions = activeReminders.filter((r) => r.isToday);
    const upcomingOccasions = activeReminders.filter((r) => !r.isToday);

    res.json({
      allActive: activeReminders,
      todayOccasions,
      upcomingOccasions,
      totalCount: activeReminders.length,
    });
  } catch (err: any) {
    console.error('Error fetching active reminders:', err);
    res.status(500).json({ error: 'Failed to fetch active reminders' });
  }
});

// 3. Check for potential duplicates by name or phone
router.post('/:familyId/check-duplicate', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { name, mobile_number, excludeId } = req.body;

    const contacts = db.find(
      'family_contacts',
      (c) => c.family_id === familyId && c.is_active !== false && c.id !== excludeId
    );

    const cleanInputPhone = (mobile_number || '').replace(/[^0-9]/g, '');
    const cleanInputName = (name || '').trim().toLowerCase();

    const matches = contacts.filter((c) => {
      const matchName =
        cleanInputName.length >= 3 &&
        c.name.trim().toLowerCase().includes(cleanInputName);
      const cleanContactPhone = (c.mobile_number || '').replace(/[^0-9]/g, '');
      const matchPhone =
        cleanInputPhone.length >= 7 &&
        cleanContactPhone.length >= 7 &&
        (cleanContactPhone.endsWith(cleanInputPhone.slice(-8)) ||
          cleanInputPhone.endsWith(cleanContactPhone.slice(-8)));

      return matchName || matchPhone;
    });

    res.json({
      isDuplicate: matches.length > 0,
      matches: matches.map((m) => ({
        id: m.id,
        name: m.name,
        relationship: m.relationship,
        mobile_number: m.mobile_number,
        photo_url: m.photo_url,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// 4. Get single contact details with all occasions
router.get('/:familyId/contacts/:id', async (req: AuthRequest, res) => {
  try {
    const { familyId, id } = req.params;
    const user = req.user!;

    const contact = db.findOne(
      'family_contacts',
      (c) => c.id === id && c.family_id === familyId && c.is_active !== false
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const permissions = db.find('contact_permissions', () => true);
    const perm = canUserViewContact(contact, user, permissions);

    if (!perm.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this contact' });
    }

    const occasions = db
      .find('family_contact_occasions', (o) => o.contact_id === id && o.is_active !== false)
      .map((occ) => {
        const calc = calculateOccasionStatus(contact, occ);
        return {
          ...occ,
          calculation: calc,
        };
      });

    res.json({
      ...contact,
      mobile_number: perm.canViewPhone ? contact.mobile_number : '',
      notes: perm.canViewNotes ? contact.notes : '',
      can_edit: perm.canEdit,
      can_view_phone: perm.canViewPhone,
      can_view_notes: perm.canViewNotes,
      occasions,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contact details' });
  }
});

// 5. Create new contact + initial occasion
router.post('/:familyId/contacts', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const user = req.user!;
    const {
      name,
      photo_url,
      mobile_number,
      relationship,
      notes,
      visibility = 'FAMILY',
      visible_to_members = [],
      occasion,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contactId = `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newContact = {
      id: contactId,
      family_id: familyId,
      name: name.trim(),
      photo_url: photo_url || '',
      mobile_number: (mobile_number || '').trim(),
      relationship: relationship || 'Friend',
      notes: notes || '',
      visibility,
      visible_to_members,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    db.insert('family_contacts', newContact);

    let createdOccasion = null;
    if (occasion && occasion.occasion_date) {
      const occasionId = `occ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      createdOccasion = {
        id: occasionId,
        contact_id: contactId,
        family_id: familyId,
        occasion_type: occasion.occasion_type || 'BIRTHDAY',
        custom_occasion_name: occasion.custom_occasion_name || '',
        occasion_date: occasion.occasion_date,
        original_year: occasion.original_year ? Number(occasion.original_year) : undefined,
        is_recurring: occasion.is_recurring !== false,
        reminder_type: occasion.reminder_type || 'OFFSET_DAYS',
        reminder_days_before:
          typeof occasion.reminder_days_before === 'number'
            ? occasion.reminder_days_before
            : 3,
        custom_reminder_date: occasion.custom_reminder_date || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.insert('family_contact_occasions', createdOccasion);

      // Add default reminder settings
      db.insert('reminder_settings', {
        id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        occasion_id: occasionId,
        dashboard_enabled: true,
        push_notification_enabled: true,
        notification_frequency: 'DAILY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.status(201).json({
      ...newContact,
      occasions: createdOccasion ? [createdOccasion] : [],
    });
  } catch (err: any) {
    console.error('Error creating contact:', err);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// 6. Update contact
router.put('/:familyId/contacts/:id', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { id } = req.params;
    const user = req.user!;
    const updates = req.body;

    const contact = db.findOne('family_contacts', (c) => c.id === id && (c.family_id === familyId || c.family_id === req.familyId));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { occasion, ...contactFields } = updates;

    const updated = db.update(
      'family_contacts',
      (c) => c.id === id,
      {
        ...contactFields,
        updated_at: new Date().toISOString(),
      }
    );

    // If primary occasion update was included
    if (occasion) {
      if (occasion.id) {
        db.update(
          'family_contact_occasions',
          (o) => o.id === occasion.id,
          {
            ...occasion,
            updated_at: new Date().toISOString(),
          }
        );
      } else {
        const existingOcc = db.findOne('family_contact_occasions', (o) => o.contact_id === id && o.is_active !== false);
        if (existingOcc) {
          db.update(
            'family_contact_occasions',
            (o) => o.id === existingOcc.id,
            {
              ...occasion,
              updated_at: new Date().toISOString(),
            }
          );
        }
      }
    }

    // Enrich with calculated occasions
    const occasions = db
      .find('family_contact_occasions', (o) => o.contact_id === id && o.is_active !== false)
      .map((occ) => {
        const calc = calculateOccasionStatus(updated || contact, occ);
        return {
          ...occ,
          calculation: calc,
        };
      });

    res.json({
      ...(updated || contact),
      occasions,
    });
  } catch (err: any) {
    console.error('Error updating contact:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// 7. Delete contact (soft delete)
router.delete('/:familyId/contacts/:id', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { id } = req.params;
    const user = req.user!;

    const contact = db.findOne('family_contacts', (c) => c.id === id && (c.family_id === familyId || c.family_id === req.familyId));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Soft delete contact and related occasions
    db.update('family_contacts', (c) => c.id === id, { is_active: false, updated_at: new Date().toISOString() });
    const occasions = db.find('family_contact_occasions', (o) => o.contact_id === id);
    for (const occ of occasions) {
      db.update('family_contact_occasions', (o) => o.id === occ.id, { is_active: false, updated_at: new Date().toISOString() });
    }

    res.json({ success: true, message: 'Contact deleted successfully', id });
  } catch (err: any) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// 8. Add another occasion to an existing person
router.post('/:familyId/contacts/:contactId/occasions', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { contactId } = req.params;
    const user = req.user!;
    const occasionData = req.body;

    const contact = db.findOne(
      'family_contacts',
      (c) => c.id === contactId && (c.family_id === familyId || c.family_id === req.familyId) && c.is_active !== false
    );
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (!occasionData.occasion_date) {
      return res.status(400).json({ error: 'Occasion date is required' });
    }

    const occasionId = `occ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newOccasion = {
      id: occasionId,
      contact_id: contactId,
      family_id: contact.family_id,
      occasion_type: occasionData.occasion_type || 'OTHER',
      custom_occasion_name: occasionData.custom_occasion_name || '',
      occasion_date: occasionData.occasion_date,
      original_year: occasionData.original_year ? Number(occasionData.original_year) : undefined,
      is_recurring: occasionData.is_recurring !== false,
      reminder_type: occasionData.reminder_type || 'OFFSET_DAYS',
      reminder_days_before:
        typeof occasionData.reminder_days_before === 'number'
          ? occasionData.reminder_days_before
          : 3,
      custom_reminder_date: occasionData.custom_reminder_date || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.insert('family_contact_occasions', newOccasion);

    const calc = calculateOccasionStatus(contact, newOccasion);

    res.status(201).json({
      ...newOccasion,
      calculation: calc,
    });
  } catch (err: any) {
    console.error('Error adding occasion:', err);
    res.status(500).json({ error: 'Failed to add occasion' });
  }
});

// 9. Update specific occasion
router.put('/:familyId/occasions/:occasionId', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { occasionId } = req.params;
    const user = req.user!;
    const updates = req.body;

    const occasion = db.findOne(
      'family_contact_occasions',
      (o) => o.id === occasionId && (o.family_id === familyId || o.family_id === req.familyId)
    );
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    const updated = db.update(
      'family_contact_occasions',
      (o) => o.id === occasionId,
      {
        ...updates,
        updated_at: new Date().toISOString(),
      }
    );

    const contact = db.findOne('family_contacts', (c) => c.id === occasion.contact_id);
    const calc = contact ? calculateOccasionStatus(contact, updated || occasion) : null;

    res.json({
      ...(updated || occasion),
      calculation: calc,
    });
  } catch (err: any) {
    console.error('Error updating occasion:', err);
    res.status(500).json({ error: 'Failed to update occasion' });
  }
});

// 10. Delete specific occasion (soft delete)
router.delete('/:familyId/occasions/:occasionId', async (req: AuthRequest, res) => {
  try {
    const familyId = req.params.familyId || req.familyId!;
    const { occasionId } = req.params;
    const user = req.user!;

    const occasion = db.findOne(
      'family_contact_occasions',
      (o) => o.id === occasionId && (o.family_id === familyId || o.family_id === req.familyId)
    );
    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    db.update('family_contact_occasions', (o) => o.id === occasionId, { is_active: false, updated_at: new Date().toISOString() });

    res.json({ success: true, message: 'Occasion deleted', id: occasionId });
  } catch (err: any) {
    console.error('Error deleting occasion:', err);
    res.status(500).json({ error: 'Failed to delete occasion' });
  }
});

export default router;
