# Smart Greenhouse Monitoring & Control System

A mobile-first, cloud-enabled smart agriculture dashboard for real-time greenhouse monitoring and automated crop management. Built with React 19, tRPC, Express, and a cyberpunk aesthetic optimized for Android/Chrome browsers.

## 🌾 Overview

This system provides comprehensive monitoring and control of greenhouse environments with real-time sensor data from ESP32 microcontrollers, rule-based automation that applies crop-specific growth stage logic, multi-greenhouse management with comparative analytics, and 30 Rwanda crops with comprehensive agronomic parameters. The system includes manual override controls for emergency situations, decision logging with explainable reasoning, and advanced analytics with historical trends and statistics.

## 🎨 Design

The interface features a high-contrast cyberpunk aesthetic with a deep black background, vibrant neon pink (#EC4899) and electric cyan (#00FFFF) typography, intense outer glow effects simulating neon signage, HUD-style elements with corner brackets and technical lines, and mobile-responsive design optimized for smartphones.

## 📋 Features

### Core Dashboard
The main dashboard displays a 2×2 sensor grid showing temperature, humidity, soil moisture, and light level with status indicators. The crop information card shows the selected crop name, scientific name, current growth stage, and days since planting. Real-time actuator status indicators display ON/OFF states for pump, fan, and light. A system mode toggle allows switching between AUTO (rule-based) and MANUAL (manual control) modes with visual warnings. The decision log shows the last 10 timestamped actions with human-readable explanations.

### Analytics Dashboard
The analytics page includes trend charts for temperature, humidity, soil moisture, and light level using line and area visualizations. Statistics cards display min/max/average values for all sensors. Time range filtering allows viewing data for 24-hour, 7-day, and 30-day periods. A decision frequency bar chart shows actuator activation patterns, and a scrollable log displays recent decisions with timestamps and reasoning.

### Multi-Greenhouse Management
The greenhouses page allows viewing and switching between multiple greenhouses. Greenhouse cards display current sensor readings and status for each greenhouse. Users can create new greenhouses or remove existing ones. A foundation for comparative analytics comparing multiple greenhouses is included for future development.

### Settings & Configuration
Users can select from 30 Rwanda crops with detailed agronomic parameters, set the planting date to calculate growth stage, and reset the system to clear data and reconfigure.

## 🚀 Technology Stack

### Frontend
React 19 for the UI framework, Tailwind CSS 4 for utility-first styling with OKLCH color format, Recharts for data visualization, shadcn/ui for accessible components, Wouter for lightweight routing, and Vite for fast builds.

### Backend
Express 4 for the HTTP server, tRPC 11 for end-to-end typesafe APIs, Drizzle ORM for type-safe database queries, MySQL/TiDB for the database, and Zod for schema validation.

### Testing & Quality
Vitest for unit testing, TypeScript for static type checking, and ESLint & Prettier for code quality and formatting.

## 📦 Project Structure

```
smart-greenhouse-system/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/trpc.ts       # tRPC client setup
│   │   ├── App.tsx           # Router and layout
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   └── index.html            # HTML entry point
├── server/                    # Express backend
│   ├── routers/
│   │   ├── esp32.ts          # ESP32 sensor data
│   │   └── (other routers)
│   ├── db.ts                 # Database helpers
│   ├── decisionEngine.ts     # Automation logic
│   ├── routers.ts            # tRPC procedures
│   └── _core/                # Framework plumbing
├── drizzle/                   # Database schema
├── shared/                    # Shared types
├── ESP32_Firmware_Sketch.ino # Arduino firmware
├── ESP32_WIRING_GUIDE.md     # Hardware setup
├── seed-db.mjs               # Populate crops
├── seed-rwanda-crops.mjs      # Load Rwanda crops
└── README.md                 # This file
```

## 🛠️ Installation & Setup

### Prerequisites
Node.js 22+, pnpm 10+, MySQL 8+ or TiDB, and optionally an ESP32 microcontroller for hardware integration.

### Backend Setup

1. **Install dependencies**
   ```bash
   cd smart-greenhouse-system
   pnpm install
   ```

2. **Configure environment variables**
   Set up your `.env` file with database connection, JWT secret, and OAuth credentials.

3. **Initialize database**
   ```bash
   pnpm db:push
   ```

4. **Seed crop data**
   ```bash
   node seed-db.mjs           # Load base crops
   node seed-rwanda-crops.mjs # Load 30 Rwanda crops
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

The server runs on `http://localhost:3000`

## 📱 ESP32 Hardware Integration

### Wiring Diagram

See `ESP32_WIRING_GUIDE.md` for detailed wiring instructions.

**Components Required:**
ESP32 DevKit, DHT22 temperature/humidity sensor, capacitive soil moisture sensor, light sensor (LDR or BH1750), 3× 5V relay modules for pump/fan/light control, 5V power supply, and jumper wires.

### Firmware Upload

1. Install Arduino IDE and ESP32 board support
2. Open `ESP32_Firmware_Sketch.ino`
3. Configure WiFi credentials and API endpoint
4. Upload to ESP32 board
5. Monitor serial output to verify sensor readings

### Data Transmission

The ESP32 sends sensor data via HTTP POST to `/api/trpc/esp32.ingestSensorData` with temperature, humidity, soil moisture, light level, and timestamp. The system responds with actuator commands.

## 🌾 Crop Database

The system includes 30 Rwanda crops with comprehensive parameters including temperature ranges, humidity requirements, soil moisture targets, light requirements, Kc coefficients for irrigation, and growth stage durations. Crops include Maize, Cassava, Tomato, Coffee, Tea, Banana, Beans, Potato, Avocado, Citrus, and 20 additional crops.

Each crop has temperature thresholds for optimal growth, humidity requirements for each growth stage, soil moisture targets (minimum and maximum), light requirements (lux levels), Kc coefficients for irrigation calculations, and growth stage durations (days).

## 🤖 Decision Engine

The rule-based automation engine applies crop-specific logic by calculating the growth stage based on days since planting, evaluating sensor data against stage-specific thresholds, applying rules to determine actuator actions, logging decisions with reasoning, and executing actions in AUTO mode or logging only in MANUAL mode.

Example decision logic: IF growth_stage == "Flowering" AND humidity < 60% THEN activate fan to increase air circulation and humidity.

## 📊 API Endpoints

### Greenhouse Management
`greenhouse.getOrCreate`, `greenhouse.updateMode`, `greenhouse.setCrop`

### Sensor Data
`sensor.getCurrent`, `sensor.recordReading`, `esp32.getLatestReadings`, `esp32.getAggregatedStats`

### Actuators
`actuator.getAll`, `actuator.toggle`

### Decisions
`decision.getHistory`, `decision.makeDecision`

### Crops
`crop.list`

## 🧪 Testing

Run all tests with `pnpm test`. Test files include decision engine tests (15 tests), ESP32 router tests (11 tests), and authentication tests (1 test). All 27 tests pass with zero TypeScript errors.

## 🚀 Deployment

Build for production with `pnpm build` and start the production server with `pnpm start`. Ensure all required environment variables are set including DATABASE_URL, JWT_SECRET, NODE_ENV=production, and OAuth credentials.

## 📖 Documentation

See `ESP32_WIRING_GUIDE.md` for hardware setup, `server/routers.ts` for API reference, `drizzle/schema.ts` for database schema, and `server/decisionEngine.ts` for automation logic.

## 🎯 Future Enhancements

Real-time WebSocket updates for live sensor streaming, predictive alerts with anomaly detection, multi-user collaboration with greenhouse sharing, native mobile apps, weather integration, historical data exports, advanced analytics with machine learning, and integration with IoT platforms like AWS IoT and Azure IoT Hub.

## 📝 License

MIT License

## 👥 Support

For issues, questions, or feature requests, please open an issue on the project repository.

---

**Built with ❤️ for sustainable agriculture**
