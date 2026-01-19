import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Crop knowledge base with stage parameters
 * Stores crop types and their growth stage requirements
 */
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Maize"
  scientificName: varchar("scientificName", { length: 150 }), // e.g., "Zea mays"
  stages: text("stages").notNull(), // JSON: [{name, duration, kc, tempMin, tempMax, humidityMin, humidityMax, soilMoistureMin, soilMoistureMax}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Crop = typeof crops.$inferSelect;
export type InsertCrop = typeof crops.$inferInsert;

/**
 * Greenhouse instance for a user
 */
export const greenhouses = mysqlTable("greenhouses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  selectedCropId: int("selectedCropId"),
  plantingDate: timestamp("plantingDate"),
  systemMode: mysqlEnum("systemMode", ["AUTO", "MANUAL"]).default("AUTO").notNull(),
  cloudConnected: int("cloudConnected").default(1).notNull(), // 1 = true, 0 = false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Greenhouse = typeof greenhouses.$inferSelect;
export type InsertGreenhouse = typeof greenhouses.$inferInsert;

/**
 * Real-time sensor readings
 */
export const sensorReadings = mysqlTable("sensorReadings", {
  id: int("id").autoincrement().primaryKey(),
  greenhouseId: int("greenhouseId").notNull(),
  temperature: int("temperature").notNull(), // Stored as integer (e.g., 2500 = 25.00°C)
  humidity: int("humidity").notNull(), // 0-100
  soilMoisture: int("soilMoisture").notNull(), // 0-100
  lightLevel: int("lightLevel").notNull(), // Lux or relative value
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = typeof sensorReadings.$inferInsert;

/**
 * Actuator states (Pump, Fan, Light)
 */
export const actuators = mysqlTable("actuators", {
  id: int("id").autoincrement().primaryKey(),
  greenhouseId: int("greenhouseId").notNull(),
  type: mysqlEnum("type", ["PUMP", "FAN", "LIGHT"]).notNull(),
  state: int("state").default(0).notNull(), // 1 = ON, 0 = OFF
  lastToggled: timestamp("lastToggled").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Actuator = typeof actuators.$inferSelect;
export type InsertActuator = typeof actuators.$inferInsert;

/**
 * Decision log for rule-based actions
 */
export const decisionLogs = mysqlTable("decisionLogs", {
  id: int("id").autoincrement().primaryKey(),
  greenhouseId: int("greenhouseId").notNull(),
  actuatorType: mysqlEnum("actuatorType", ["PUMP", "FAN", "LIGHT"]).notNull(),
  action: mysqlEnum("action", ["ON", "OFF"]).notNull(),
  reason: text("reason").notNull(), // Human-readable explanation
  cropName: varchar("cropName", { length: 100 }),
  growthStage: varchar("growthStage", { length: 50 }),
  sensorValues: text("sensorValues"), // JSON: {temp, humidity, soilMoisture, light}
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type DecisionLog = typeof decisionLogs.$inferSelect;
export type InsertDecisionLog = typeof decisionLogs.$inferInsert;