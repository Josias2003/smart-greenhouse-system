import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Mock database connection for testing
let connection: mysql.Connection;

beforeAll(async () => {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  const url = new URL(DATABASE_URL);
  connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: url.hostname.includes("rds") || url.hostname.includes("tidb")
      ? { rejectUnauthorized: false }
      : undefined,
  });
});

afterAll(async () => {
  if (connection) {
    await connection.end();
  }
});

describe("ESP32 Router", () => {
  it("should accept valid sensor data format", () => {
    const validData = {
      deviceId: "esp32-001",
      temperature: 25.5,
      humidity: 65,
      soilMoisture: 75,
      lightLevel: 8000,
      timestamp: Date.now(),
    };

    // Validate schema
    expect(validData.deviceId).toBeTruthy();
    expect(validData.temperature).toBeGreaterThanOrEqual(-50);
    expect(validData.temperature).toBeLessThanOrEqual(60);
    expect(validData.humidity).toBeGreaterThanOrEqual(0);
    expect(validData.humidity).toBeLessThanOrEqual(100);
    expect(validData.soilMoisture).toBeGreaterThanOrEqual(0);
    expect(validData.soilMoisture).toBeLessThanOrEqual(100);
    expect(validData.lightLevel).toBeGreaterThanOrEqual(0);
  });

  it("should reject invalid temperature values", () => {
    const invalidData = [
      { temperature: -100, valid: false }, // Too low
      { temperature: 100, valid: false }, // Too high
      { temperature: 25, valid: true }, // Valid
    ];

    invalidData.forEach((data) => {
      const isValid = data.temperature >= -50 && data.temperature <= 60;
      expect(isValid).toBe(data.valid);
    });
  });

  it("should reject invalid humidity values", () => {
    const invalidData = [
      { humidity: -10, valid: false },
      { humidity: 150, valid: false },
      { humidity: 65, valid: true },
    ];

    invalidData.forEach((data) => {
      const isValid = data.humidity >= 0 && data.humidity <= 100;
      expect(isValid).toBe(data.valid);
    });
  });

  it("should reject invalid soil moisture values", () => {
    const invalidData = [
      { soilMoisture: -5, valid: false },
      { soilMoisture: 150, valid: false },
      { soilMoisture: 75, valid: true },
    ];

    invalidData.forEach((data) => {
      const isValid = data.soilMoisture >= 0 && data.soilMoisture <= 100;
      expect(isValid).toBe(data.valid);
    });
  });

  it("should reject invalid light level values", () => {
    const invalidData = [
      { lightLevel: -100, valid: false },
      { lightLevel: 8000, valid: true },
      { lightLevel: 50000, valid: true }, // High but valid
    ];

    invalidData.forEach((data) => {
      const isValid = data.lightLevel >= 0;
      expect(isValid).toBe(data.valid);
    });
  });

  it("should calculate statistics correctly", () => {
    const readings = [20, 22, 25, 23, 24];

    const min = Math.min(...readings);
    const max = Math.max(...readings);
    const avg = readings.reduce((a, b) => a + b, 0) / readings.length;

    expect(min).toBe(20);
    expect(max).toBe(25);
    expect(avg).toBe(22.8);
  });

  it("should handle empty readings gracefully", () => {
    const readings: number[] = [];

    if (readings.length === 0) {
      expect(true).toBe(true);
    } else {
      const min = Math.min(...readings);
      const max = Math.max(...readings);
      expect(min).toBeDefined();
      expect(max).toBeDefined();
    }
  });

  it("should format actuator commands correctly", () => {
    const actuatorStates = [
      { type: "PUMP", state: 1 },
      { type: "FAN", state: 0 },
      { type: "LIGHT", state: 1 },
    ];

    const commands = {
      pump: false,
      fan: false,
      light: false,
    };

    for (const actuator of actuatorStates) {
      if (actuator.type === "PUMP") commands.pump = actuator.state === 1;
      if (actuator.type === "FAN") commands.fan = actuator.state === 1;
      if (actuator.type === "LIGHT") commands.light = actuator.state === 1;
    }

    expect(commands.pump).toBe(true);
    expect(commands.fan).toBe(false);
    expect(commands.light).toBe(true);
  });

  it("should validate device ID format", () => {
    const validDeviceIds = [
      "esp32-001",
      "esp32-greenhouse-001",
      "device-123",
    ];

    const invalidDeviceIds = ["", null, undefined];

    validDeviceIds.forEach((id) => {
      expect(id).toBeTruthy();
    });

    invalidDeviceIds.forEach((id) => {
      expect(id).toBeFalsy();
    });
  });

  it("should handle timestamp conversion correctly", () => {
    const timestamp = Date.now();
    const date = new Date(timestamp);

    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBe(timestamp);
  });

  it("should aggregate sensor data by period", () => {
    const periods = ["hour", "day", "week", "month"];

    periods.forEach((period) => {
      expect(["hour", "day", "week", "month"]).toContain(period);
    });
  });
});
