import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

// Parse MySQL connection string
const url = new URL(DATABASE_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.hostname.includes('rds') || url.hostname.includes('tidb') ? { rejectUnauthorized: false } : undefined,
});

try {
  // Load processed Rwanda crops
  const cropsPath = path.join(process.cwd(), 'rwanda_crops_processed.json');
  const cropsData = JSON.parse(fs.readFileSync(cropsPath, 'utf-8'));

  console.log(`Loading ${cropsData.length} Rwanda crops...\n`);

  // Check which crops already exist
  const existingCrops = await connection.execute('SELECT name FROM crops');
  const existingNames = new Set(existingCrops[0].map(row => row.name));

  let insertedCount = 0;
  let skippedCount = 0;

  // Insert crops
  for (const crop of cropsData) {
    if (existingNames.has(crop.name)) {
      console.log(`⊘ Skipped: ${crop.name} (already exists)`);
      skippedCount++;
      continue;
    }

    try {
      const stagesJson = JSON.stringify(crop.stages);
      await connection.execute(
        'INSERT INTO crops (name, scientificName, stages) VALUES (?, ?, ?)',
        [crop.name, crop.scientificName, stagesJson]
      );
      console.log(`✓ Inserted: ${crop.name}`);
      insertedCount++;
    } catch (error) {
      console.error(`✗ Error inserting ${crop.name}:`, error.message);
    }
  }

  console.log(`\n✓ Rwanda crops seeding completed!`);
  console.log(`  Inserted: ${insertedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Total: ${cropsData.length}`);
} catch (error) {
  console.error('Error seeding Rwanda crops:', error);
  process.exit(1);
} finally {
  await connection.end();
}
