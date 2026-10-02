import { BlobServiceClient } from '@azure/storage-blob';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function matchAndFix() {
  const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!);
  const cc = blobService.getContainerClient('famora-memories');
  const blobs: { name: string; url: string; created: Date }[] = [];

  for await (const blob of cc.listBlobsFlat()) {
    blobs.push({
      name: blob.name,
      url: `https://kinoraonemedia.blob.core.windows.net/famora-memories/${blob.name}`,
      created: blob.properties.createdOn!
    });
  }

  console.log(`Found ${blobs.length} blobs in Azure famora-memories.`);
  
  // Sort blobs by name / timestamp
  blobs.sort((a, b) => a.name.localeCompare(b.name));

  // Group by edit timestamp batch
  const batches: Record<string, string[]> = {};
  for (const b of blobs) {
    // blob name format: fam_1789381570680/memory_edit_TIMESTAMP_INDEX.jpg_...
    const match = b.name.match(/memory_edit_(\d+)_\d+/);
    if (match) {
      const batchId = match[1];
      if (!batches[batchId]) batches[batchId] = [];
      batches[batchId].push(b.url);
    }
  }

  console.log('Detected Azure Upload Batches:');
  Object.keys(batches).forEach(k => {
    console.log(`Batch ${k}: ${batches[k].length} photos`);
  });

  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const memRes = await client.query(`SELECT id, title, photos, created_at FROM memories WHERE family_id = 'fam_1789381570680' ORDER BY created_at ASC`);
  console.log('\nCurrent Memories in Postgres for fam_1789381570680:');
  memRes.rows.forEach(r => console.log(r.id, r.title, typeof r.photos === 'string' ? r.photos.slice(0, 80) : r.photos));

  await client.end();
}

matchAndFix().catch(console.error);
