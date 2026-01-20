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

try {
  // Get or create a test user
  const users = await connection.execute('SELECT id FROM users LIMIT 1');
  let userId = 1;
  if (users[0].length === 0) {
    const result = await connection.execute(
      'INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)',
      ['test-user-001', 'Test User', 'test@example.com', 'test', 'user']
    );
    userId = result[0].insertId;
  } else {
    userId = users[0][0].id;
  }

  // Get or create a greenhouse
  const greenhouses = await connection.execute(
    'SELECT id FROM greenhouses WHERE userId = ? LIMIT 1',
    [userId]
  );
  let greenhouseId = 1;
  if (greenhouses[0].length === 0) {
    const result = await connection.execute(
      'INSERT INTO greenhouses (userId, name, selectedCropId, plantingDate, systemMode, cloudConnected) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'Test Greenhouse', 1, new Date(Date.now() - 47 * 24 * 60 * 60 * 1000), 'AUTO', 1]
    );
    greenhouseId = result[0].insertId;
  } else {
    greenhouseId = greenhouses[0][0].id;
  }

  // Insert sample sensor readings
  const now = Date.now();
  const readings = [];
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now - i * 5 * 60 * 1000); // 5 minutes apart
    readings.push([
      greenhouseId,
      2500 + Math.random() * 500 - 250, // Temperature: 25°C ± 2.5°C
      65 + Math.random() * 20 - 10, // Humidity: 65% ± 10%
      70 + Math.random() * 30 - 15, // Soil Moisture: 70% ± 15%
      8000 + Math.random() * 4000 - 2000, // Light: 8000 ± 2000
      timestamp,
    ]);
  }

  for (const reading of readings) {
    await connection.execute(
      'INSERT INTO sensorReadings (greenhouseId, temperature, humidity, soilMoisture, lightLevel, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      reading
    );
  }
  console.log(`✓ Inserted ${readings.length} sensor readings`);

  // Initialize actuators
  const actuatorTypes = ['PUMP', 'FAN', 'LIGHT'];
  for (const type of actuatorTypes) {
    const existing = await connection.execute(
      'SELECT id FROM actuators WHERE greenhouseId = ? AND type = ? LIMIT 1',
      [greenhouseId, type]
    );
    if (existing[0].length === 0) {
      await connection.execute(
        'INSERT INTO actuators (greenhouseId, type, state, lastToggled) VALUES (?, ?, ?, ?)',
        [greenhouseId, type, 0, new Date()]
      );
    }
  }
  console.log('✓ Initialized actuators');

  // Insert sample decision logs
  const decisions = [
    ['PUMP', 'ON', 'Maize (Mid stage), soil moisture 22% < threshold 60%', 'Maize', 'Mid', '{"temperature": 25, "humidity": 65, "soilMoisture": 22, "lightLevel": 8000}'],
    ['FAN', 'OFF', 'Temperature 25.0°C within range, humidity 65% within range', 'Maize', 'Mid', '{"temperature": 25, "humidity": 65, "soilMoisture": 70, "lightLevel": 8000}'],
    ['LIGHT', 'OFF', 'Light level 8000 adequate', 'Maize', 'Mid', '{"temperature": 25, "humidity": 65, "soilMoisture": 70, "lightLevel": 8000}'],
    ['PUMP', 'OFF', 'Maize (Mid stage), soil moisture 75% within range', 'Maize', 'Mid', '{"temperature": 25, "humidity": 65, "soilMoisture": 75, "lightLevel": 8000}'],
  ];

  for (let i = 0; i < decisions.length; i++) {
    const [actuatorType, action, reason, cropName, growthStage, sensorValues] = decisions[i];
    const timestamp = new Date(now - (decisions.length - i) * 15 * 60 * 1000); // 15 minutes apart
    await connection.execute(
      'INSERT INTO decisionLogs (greenhouseId, actuatorType, action, reason, cropName, growthStage, sensorValues, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [greenhouseId, actuatorType, action, reason, cropName, growthStage, sensorValues, timestamp]
    );
  }
  console.log(`✓ Inserted ${decisions.length} decision logs`);

  console.log('\n✓ Sample data seeding completed successfully!');
  console.log(`  User ID: ${userId}`);
  console.log(`  Greenhouse ID: ${greenhouseId}`);
} catch (error) {
  console.error('Error seeding data:', error);
  process.exit(1);
} finally {
  await connection.end();
}
