import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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

// Crop knowledge base with stage parameters
const cropsData = [
  {
    name: 'Maize',
    scientificName: 'Zea mays',
    stages: JSON.stringify([
      {
        name: 'Initial',
        duration: 14,
        kc: 0.3,
        tempMin: 15,
        tempMax: 30,
        humidityMin: 40,
        humidityMax: 80,
        soilMoistureMin: 40,
        soilMoistureMax: 100,
      },
      {
        name: 'Development',
        duration: 20,
        kc: 0.6,
        tempMin: 18,
        tempMax: 32,
        humidityMin: 45,
        humidityMax: 85,
        soilMoistureMin: 50,
        soilMoistureMax: 100,
      },
      {
        name: 'Mid',
        duration: 25,
        kc: 1.0,
        tempMin: 20,
        tempMax: 35,
        humidityMin: 50,
        humidityMax: 90,
        soilMoistureMin: 60,
        soilMoistureMax: 100,
      },
      {
        name: 'Late',
        duration: 20,
        kc: 0.7,
        tempMin: 18,
        tempMax: 33,
        humidityMin: 40,
        humidityMax: 80,
        soilMoistureMin: 40,
        soilMoistureMax: 80,
      },
    ]),
  },
  {
    name: 'Cassava',
    scientificName: 'Manihot esculenta',
    stages: JSON.stringify([
      {
        name: 'Initial',
        duration: 21,
        kc: 0.4,
        tempMin: 18,
        tempMax: 32,
        humidityMin: 50,
        humidityMax: 85,
        soilMoistureMin: 45,
        soilMoistureMax: 100,
      },
      {
        name: 'Development',
        duration: 30,
        kc: 0.7,
        tempMin: 20,
        tempMax: 33,
        humidityMin: 55,
        humidityMax: 90,
        soilMoistureMin: 55,
        soilMoistureMax: 100,
      },
      {
        name: 'Mid',
        duration: 60,
        kc: 1.0,
        tempMin: 22,
        tempMax: 34,
        humidityMin: 60,
        humidityMax: 90,
        soilMoistureMin: 60,
        soilMoistureMax: 100,
      },
      {
        name: 'Late',
        duration: 30,
        kc: 0.5,
        tempMin: 20,
        tempMax: 32,
        humidityMin: 50,
        humidityMax: 80,
        soilMoistureMin: 40,
        soilMoistureMax: 80,
      },
    ]),
  },
  {
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    stages: JSON.stringify([
      {
        name: 'Initial',
        duration: 14,
        kc: 0.4,
        tempMin: 16,
        tempMax: 28,
        humidityMin: 50,
        humidityMax: 80,
        soilMoistureMin: 50,
        soilMoistureMax: 100,
      },
      {
        name: 'Development',
        duration: 21,
        kc: 0.7,
        tempMin: 18,
        tempMax: 30,
        humidityMin: 55,
        humidityMax: 85,
        soilMoistureMin: 60,
        soilMoistureMax: 100,
      },
      {
        name: 'Mid',
        duration: 35,
        kc: 1.0,
        tempMin: 20,
        tempMax: 32,
        humidityMin: 60,
        humidityMax: 85,
        soilMoistureMin: 65,
        soilMoistureMax: 100,
      },
      {
        name: 'Late',
        duration: 21,
        kc: 0.8,
        tempMin: 18,
        tempMax: 30,
        humidityMin: 50,
        humidityMax: 80,
        soilMoistureMin: 50,
        soilMoistureMax: 90,
      },
    ]),
  },
];

try {
  // Insert crops
  for (const crop of cropsData) {
    await connection.execute(
      'INSERT INTO crops (name, scientificName, stages) VALUES (?, ?, ?)',
      [crop.name, crop.scientificName, crop.stages]
    );
    console.log(`✓ Inserted crop: ${crop.name}`);
  }

  console.log('\n✓ Database seeding completed successfully!');
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
} finally {
  await connection.end();
}
