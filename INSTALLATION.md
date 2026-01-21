# Installation & Setup Guide

Complete step-by-step instructions for setting up the Smart Greenhouse Monitoring System.

## Prerequisites

- **Node.js** 22.0 or higher
- **pnpm** 10.0 or higher (package manager)
- **MySQL** 8.0+ or **TiDB** (database)
- **Git** (for version control)
- **Arduino IDE** (optional, for ESP32 firmware)

## Quick Start (Development)

### 1. Clone and Install

```bash
cd smart-greenhouse-system
pnpm install
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE greenhouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configuration

The system uses pre-configured environment variables. Key variables include:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing key
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend URL

### 4. Initialize Database Schema

```bash
pnpm db:push
```

This creates all tables: users, greenhouses, crops, sensors, actuators, and decision logs.

### 5. Seed Crop Data

Load the crop knowledge base:
```bash
node seed-db.mjs           # Base crops (Maize, Cassava, Tomato)
node seed-rwanda-crops.mjs # 30 Rwanda crops
```

### 6. Start Development Server

```bash
pnpm dev
```

Access the dashboard at `http://localhost:3000`

## Production Deployment

### 1. Build

```bash
pnpm build
```

This creates optimized frontend bundles and backend code.

### 2. Start Server

```bash
pnpm start
```

### 3. Environment Variables

Set production environment variables:
```bash
NODE_ENV=production
DATABASE_URL=mysql://user:pass@prod-host:3306/greenhouse
JWT_SECRET=your-secure-random-secret
# OAuth and API credentials
```

## ESP32 Hardware Setup

### Components

- ESP32 DevKit (or compatible board)
- DHT22 temperature/humidity sensor
- Capacitive soil moisture sensor
- Light sensor (BH1750 or LDR with ADC)
- 3× 5V relay modules
- 5V power supply
- Jumper wires and breadboard

### Wiring

Refer to `ESP32_WIRING_GUIDE.md` for detailed pin connections.

### Firmware Upload

1. Install Arduino IDE from https://www.arduino.cc/en/software
2. Add ESP32 board support via Boards Manager
3. Open `ESP32_Firmware_Sketch.ino`
4. Configure WiFi SSID and password
5. Set API endpoint: `http://your-server/api/trpc/esp32.ingestSensorData`
6. Select board: ESP32 Dev Module
7. Select correct COM port
8. Click Upload
9. Monitor serial output (115200 baud) to verify

### Sensor Calibration

After uploading firmware, calibrate sensors:

**Soil Moisture Sensor:**
- Dry reading: ~4095 (ADC max)
- Wet reading: ~1000 (in water)
- Adjust thresholds in firmware as needed

**Light Sensor:**
- Calibrate against known light levels
- Update lux conversion constants

## Testing

Run all tests:
```bash
pnpm test
```

Run specific test file:
```bash
pnpm test server/decisionEngine.test.ts
```

Watch mode for development:
```bash
pnpm test --watch
```

## Database Management

### View Database

Connect with MySQL client:
```bash
mysql -h localhost -u user -p greenhouse
```

### Backup Database

```bash
mysqldump -u user -p greenhouse > backup.sql
```

### Restore Database

```bash
mysql -u user -p greenhouse < backup.sql
```

### Reset Database

```bash
pnpm db:push --force
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill process
```

Or use a different port:
```bash
PORT=3001 pnpm dev
```

### Database Connection Error

Verify connection string in environment:
```bash
mysql -h <host> -u <user> -p <database>
```

### ESP32 Upload Fails

- Check USB cable connection
- Verify COM port in Arduino IDE
- Hold BOOT button while uploading (some boards)
- Try different USB port

### Sensor Data Not Received

1. Check ESP32 serial output for errors
2. Verify WiFi connection
3. Confirm API endpoint URL in firmware
4. Check firewall rules
5. Verify database is running

## Development Workflow

### Adding a New Feature

1. Update database schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to migrate
3. Add database helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build frontend components in `client/src/pages/`
6. Write tests in `*.test.ts` files
7. Run `pnpm test` to verify

### Code Quality

Format code:
```bash
pnpm format
```

Type check:
```bash
pnpm check
```

## Performance Optimization

### Frontend

- Code splitting with Vite
- Image optimization
- CSS minification
- JavaScript bundling

### Backend

- Database query optimization
- Connection pooling
- Response caching
- Compression middleware

### Database

- Index frequently queried columns
- Archive old sensor data
- Partition large tables

## Security

- Use HTTPS in production
- Set strong JWT_SECRET
- Validate all inputs with Zod
- Use environment variables for secrets
- Enable database SSL connections
- Implement rate limiting
- Regular security audits

## Monitoring

Monitor application health:
```bash
# Check server status
curl http://localhost:3000/health

# View logs
tail -f logs/app.log

# Monitor database
SHOW PROCESSLIST;
```

## Getting Help

- Check error logs: `server/_core/index.ts`
- Review database schema: `drizzle/schema.ts`
- Test procedures: `server/*.test.ts`
- API documentation: `server/routers.ts`

---

For additional help, refer to the main README.md
