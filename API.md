# API Reference

Complete documentation of all tRPC procedures available in the Smart Greenhouse System.

## Authentication

All protected procedures require a valid session cookie obtained through Manus OAuth.

### auth.me
Get current authenticated user.
- **Type:** Public Query
- **Returns:** User object or null

### auth.logout
Clear session and logout user.
- **Type:** Public Mutation
- **Returns:** { success: true }

## Greenhouse Management

### greenhouse.getOrCreate
Get or create the current user's greenhouse.
- **Type:** Protected Query
- **Returns:** Greenhouse object

### greenhouse.updateMode
Toggle greenhouse between AUTO and MANUAL mode.
- **Type:** Protected Mutation
- **Input:** { greenhouseId: number, mode: "AUTO" | "MANUAL" }
- **Returns:** { success: true }

### greenhouse.setCrop
Select a crop and set planting date.
- **Type:** Protected Mutation
- **Input:** { greenhouseId: number, cropId: number, plantingDate: number }
- **Returns:** { success: true }

## Crop Management

### crop.list
Get all available crops with parameters.
- **Type:** Public Query
- **Returns:** Array of crops with stages, temperature ranges, humidity requirements

## Sensor Data

### sensor.getCurrent
Get latest sensor reading for a greenhouse.
- **Type:** Protected Query
- **Input:** { greenhouseId: number }
- **Returns:** { temperature, humidity, soilMoisture, lightLevel, timestamp }

### sensor.recordReading
Manually record sensor data.
- **Type:** Protected Mutation
- **Input:** { greenhouseId: number, temperature, humidity, soilMoisture, lightLevel }
- **Returns:** { success: true }

## ESP32 Integration

### esp32.ingestSensorData
Ingest sensor data from ESP32 device (public endpoint).
- **Type:** Public Mutation
- **Input:** { deviceId: string, temperature, humidity, soilMoisture, lightLevel, timestamp? }
- **Returns:** { success: true, readingId: number }

### esp32.getLatestReadings
Get historical sensor readings.
- **Type:** Protected Query
- **Input:** { greenhouseId: number }
- **Returns:** Array of sensor readings (last 100)

### esp32.getAggregatedStats
Get aggregated sensor statistics.
- **Type:** Protected Query
- **Input:** { greenhouseId: number, period: "hour" | "day" | "week" | "month" }
- **Returns:** { temperature, humidity, soilMoisture, lightLevel } with min/max/avg

### esp32.getActuatorCommands
Get current actuator commands for ESP32 to apply.
- **Type:** Public Query
- **Input:** { deviceId: string }
- **Returns:** { pump: boolean, fan: boolean, light: boolean }

## Actuator Control

### actuator.getAll
Get all actuator statuses for a greenhouse.
- **Type:** Protected Query
- **Input:** { greenhouseId: number }
- **Returns:** Array of actuators with type, state, and timestamps

### actuator.toggle
Toggle an actuator ON/OFF.
- **Type:** Protected Mutation
- **Input:** { actuatorId: number, state: 0 | 1 }
- **Returns:** { success: true }

## Decision Engine

### decision.getHistory
Get past decisions and reasoning.
- **Type:** Protected Query
- **Input:** { greenhouseId: number, limit?: number }
- **Returns:** Array of decisions with actuator type, action, reason, and timestamp

### decision.makeDecision
Run decision engine and apply automation rules.
- **Type:** Protected Mutation
- **Input:** { greenhouseId: number }
- **Returns:** { success: true, decisions: {}, daysSincePlanting: number }

## System

### system.notifyOwner
Send notification to project owner.
- **Type:** Protected Mutation
- **Input:** { title: string, content: string }
- **Returns:** boolean (success/failure)

## Error Handling

All procedures return errors with standardized format:
```json
{
  "code": "UNAUTHORIZED|FORBIDDEN|NOT_FOUND|BAD_REQUEST|INTERNAL_SERVER_ERROR",
  "message": "Human-readable error description"
}
```

## Rate Limiting

ESP32 sensor ingestion endpoints support high-frequency data transmission. Recommend sending data every 5-10 minutes for optimal performance.

## Data Types

### Greenhouse
```typescript
{
  id: number
  userId: number
  name: string
  selectedCropId: number | null
  plantingDate: Date | null
  systemMode: "AUTO" | "MANUAL"
  createdAt: Date
  updatedAt: Date
}
```

### Sensor Reading
```typescript
{
  id: number
  greenhouseId: number
  temperature: number (in 1/100°C)
  humidity: number (0-100%)
  soilMoisture: number (0-100%)
  lightLevel: number (lux)
  timestamp: Date
}
```

### Actuator
```typescript
{
  id: number
  greenhouseId: number
  type: "PUMP" | "FAN" | "LIGHT"
  state: 0 | 1
  createdAt: Date
  updatedAt: Date
}
```

### Decision Log
```typescript
{
  id: number
  greenhouseId: number
  actuatorType: "PUMP" | "FAN" | "LIGHT"
  action: "ON" | "OFF"
  reason: string
  cropName: string
  growthStage: string
  sensorValues: { temperature, humidity, soilMoisture, lightLevel }
  timestamp: Date
}
```

---

For implementation details, see server/routers.ts
