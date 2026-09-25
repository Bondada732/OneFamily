import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { uploadBase64DataUrl } from '../services/storageService.js';
import db from '../db/database.js';
import { syncRecordToSupabase } from '../db/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATA_FILE = path.resolve(__dirname, '../data/store.json');

async function migrateAllMedia() {
  console.log('🔍 Scanning existing database records for local photos/files to migrate to Supabase Storage...\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ store.json not found');
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const store = JSON.parse(raw);

  let migratedCount = 0;

  // 1. Migrate Memories Photos
  const memories = store.memories || [];
  for (const mem of memories) {
    let photos = [];
    if (typeof mem.photos === 'string') {
      try {
        photos = JSON.parse(mem.photos);
      } catch {
        photos = [mem.photos];
      }
    } else if (Array.isArray(mem.photos)) {
      photos = mem.photos;
    }

    let updated = false;
    const newPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (typeof p === 'string' && p.startsWith('data:')) {
        console.log(`📸 Migrating memory photo for "${mem.title}"...`);
        const res = await uploadBase64DataUrl('famora-memories', p, `memory_${mem.id}_${i}.jpg`, mem.family_id);
        if (res.success && res.url) {
          newPhotos.push(res.url);
          migratedCount++;
          updated = true;
        } else {
          newPhotos.push(p);
        }
      } else {
        newPhotos.push(p);
      }
    }

    if (updated) {
      mem.photos = JSON.stringify(newPhotos);
      db.update('memories', (m) => m.id === mem.id, { photos: mem.photos });
      await syncRecordToSupabase('memories', mem, 'update');
    }
  }

  // 2. Migrate Documents
  const documents = store.documents || [];
  for (const doc of documents) {
    if (doc.file_url && doc.file_url.startsWith('data:')) {
      console.log(`📄 Migrating vault document for "${doc.title}"...`);
      const res = await uploadBase64DataUrl('famora-vault', doc.file_url, doc.title || `doc_${doc.id}`, doc.family_id);
      if (res.success && res.url) {
        doc.file_url = res.url;
        migratedCount++;
        db.update('documents', (d) => d.id === doc.id, { file_url: doc.file_url });
        await syncRecordToSupabase('documents', doc, 'update');
      }
    }
  }

  // 3. Migrate Family Contacts
  const contacts = store.family_contacts || [];
  for (const contact of contacts) {
    if (contact.photo_url && contact.photo_url.startsWith('data:')) {
      console.log(`👤 Migrating contact photo for "${contact.name}"...`);
      const res = await uploadBase64DataUrl('famora-memories', contact.photo_url, `contact_${contact.id}.jpg`, contact.family_id);
      if (res.success && res.url) {
        contact.photo_url = res.url;
        migratedCount++;
        db.update('family_contacts', (c) => c.id === contact.id, { photo_url: contact.photo_url });
        await syncRecordToSupabase('family_contacts', contact, 'update');
      }
    }
  }

  // 4. Migrate User Avatars
  const users = store.users || [];
  for (const user of users) {
    if (user.avatar_url && user.avatar_url.startsWith('data:')) {
      console.log(`👤 Migrating avatar for "${user.name}"...`);
      const res = await uploadBase64DataUrl('famora-memories', user.avatar_url, `avatar_${user.id}.jpg`, user.family_id);
      if (res.success && res.url) {
        user.avatar_url = res.url;
        migratedCount++;
        db.update('users', (u) => u.id === user.id, { avatar_url: user.avatar_url });
        await syncRecordToSupabase('users', user, 'update');
      }
    }
  }

  // 5. Migrate Family Photos
  const families = store.families || [];
  for (const fam of families) {
    if (fam.photo_url && fam.photo_url.startsWith('data:')) {
      console.log(`👨‍👩‍👧 Migrating family cover for "${fam.name}"...`);
      const res = await uploadBase64DataUrl('famora-memories', fam.photo_url, `family_cover_${fam.id}.jpg`, fam.id);
      if (res.success && res.url) {
        fam.photo_url = res.url;
        migratedCount++;
        db.update('families', (f) => f.id === fam.id, { photo_url: fam.photo_url });
        await syncRecordToSupabase('families', fam, 'update');
      }
    }
  }

  console.log(`\n🎉 Media Migration Complete! ${migratedCount} files/photos migrated to Supabase Storage.`);
}

migrateAllMedia().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
