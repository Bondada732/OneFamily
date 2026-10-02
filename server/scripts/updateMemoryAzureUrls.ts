import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const updates = [
  {
    id: 'mem_1789398196251',
    title: 'Ganesh chaturthi @2026',
    photos: [
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927278328_0.jpg_1790927281703_zuqan.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927278335_1.jpg_1790927281825_8dxbx.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927278341_2.jpg_1790927281046_rzkja.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927278346_3.jpg_1790927281036_zhgjm.jpeg'
    ]
  },
  {
    id: 'mem_1790080944457',
    title: 'Shree shyam baba chulkana dham',
    photos: [
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927357284_0.jpg_1790927361484_srg2r.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927357288_1.jpg_1790927360684_wssb2.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927357291_2.jpg_1790927359742_d255e.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927357293_3.jpg_1790927360851_8y3be.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927357297_4.jpg_1790927360355_tpycs.jpeg'
    ]
  },
  {
    id: 'mem_1790081683739',
    title: 'Cbse national archery tournament',
    photos: [
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927451711_0.jpg_1790927454667_j71n4.jpeg'
    ]
  },
  {
    id: 'mem_1790080721063',
    title: 'M3M 15 years celebration',
    photos: [
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535496_0.jpg_1790927537509_n5kfr.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535521_1.jpg_1790927537372_gn6tn.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535528_2.jpg_1790927538877_5xmd1.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535533_3.jpg_1790927537945_6dw04.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535542_4.jpg_1790927538041_or4jv.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535547_5.jpg_1790927538580_1gyt0.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535551_6.jpg_1790927537625_z226f.jpeg',
      'https://kinoraonemedia.blob.core.windows.net/famora-memories/fam_1789381570680/memory_edit_1790927535554_7.jpg_1790927538741_829wv.jpeg'
    ]
  }
];

async function updatePostgres() {
  const client = new Client({
    connectionString: process.env.AZURE_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  for (const item of updates) {
    const jsonStr = JSON.stringify(item.photos);
    const res = await client.query(
      `UPDATE memories SET photos = $1, updated_at = $2 WHERE id = $3 RETURNING id, title`,
      [jsonStr, new Date().toISOString(), item.id]
    );
    console.log(`Updated memory [${item.id}] "${item.title}":`, res.rowCount, 'row(s)');
  }

  await client.end();
  console.log('All Azure memory URLs successfully linked in Azure PostgreSQL!');
}

updatePostgres().catch(console.error);
