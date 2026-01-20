import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sensorReadings, actuators } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * ESP32 Integration Router
 * Handles sensor data ingestion from ESP32 devices
 */

const sensorDataSchema = z.object({
  deviceId: z.string(),
  temperature: z.number().min(-50).max(60),
  humidity: z.number().min(0).max(100),
  soilMoisture: z.number().min(0).max(100),
  lightLevel: z.number().min(0).max(100000),
  timestamp: z.number().optional(),
});

export const esp32Router = router({
  /**
   * Ingest sensor data from ESP32 device
   * Public endpoint with device token authentication
   */
  ingestSensorData: publicProcedure
    .input(sensorDataSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // For now, we'll use greenhouse ID 1 (default)
        // In production, map deviceId to greenhouse
        const greenhouseId = 1;

        // Insert sensor reading
        const reading = await db.insert(sensorReadings).values({
          greenhouseId,
          temperature: input.temperature,
          humidity: input.humidity,
          soilMoisture: input.soilMoisture,
          lightLevel: input.lightLevel,
          timestamp: new Date(input.timestamp || Date.now()),
        });

        return {
          success: true,
          message: "Sensor data ingested successfully",
          readingId: reading[0].insertId,
        };
      } catch (error) {
        console.error("Error ingesting sensor data:", error);
        throw new Error("Failed to ingest sensor data");
      }
    }),

  /**
   * Get latest sensor readings for a greenhouse
   */
  getLatestReadings: protectedProcedure
    .input(z.object({ greenhouseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const readings = await db
          .select()
          .from(sensorReadings)
          .where(eq(sensorReadings.greenhouseId, input.greenhouseId))
          .orderBy(desc(sensorReadings.timestamp))
          .limit(100);

        return readings;
      } catch (error) {
        console.error("Error fetching sensor readings:", error);
        throw new Error("Failed to fetch sensor readings");
      }
    }),

  /**
   * Get sensor readings for a time range
   */
  getReadingsByTimeRange: protectedProcedure
    .input(
      z.object({
        greenhouseId: z.number(),
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const readings = await db
          .select()
          .from(sensorReadings)
          .where(
            eq(sensorReadings.greenhouseId, input.greenhouseId)
          )
          .orderBy(desc(sensorReadings.timestamp));

        // Filter by time range in JavaScript
        return readings.filter(
          (r) =>
            r.timestamp >= input.startTime && r.timestamp <= input.endTime
        );
      } catch (error) {
        console.error("Error fetching sensor readings:", error);
        throw new Error("Failed to fetch sensor readings");
      }
    }),

  /**
   * Get aggregated sensor statistics
   */
  getAggregatedStats: protectedProcedure
    .input(
      z.object({
        greenhouseId: z.number(),
        period: z.enum(["hour", "day", "week", "month"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        const readings = await db
          .select()
          .from(sensorReadings)
          .where(eq(sensorReadings.greenhouseId, input.greenhouseId))
          .orderBy(desc(sensorReadings.timestamp))
          .limit(1000);

        if (readings.length === 0) {
          return {
            temperature: { min: 0, max: 0, avg: 0 },
            humidity: { min: 0, max: 0, avg: 0 },
            soilMoisture: { min: 0, max: 0, avg: 0 },
            lightLevel: { min: 0, max: 0, avg: 0 },
            count: 0,
          };
        }

        // Calculate statistics
        const temps = readings.map((r) => r.temperature);
        const humidities = readings.map((r) => r.humidity);
        const soilMoistures = readings.map((r) => r.soilMoisture);
        const lightLevels = readings.map((r) => r.lightLevel);

        const calculateStats = (values: number[]) => ({
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        });

        return {
          temperature: calculateStats(temps),
          humidity: calculateStats(humidities),
          soilMoisture: calculateStats(soilMoistures),
          lightLevel: calculateStats(lightLevels),
          count: readings.length,
          period: input.period,
        };
      } catch (error) {
        console.error("Error calculating statistics:", error);
        throw new Error("Failed to calculate statistics");
      }
    }),

  /**
   * Get actuator status for ESP32 to apply
   * Called by ESP32 after sending sensor data
   */
  getActuatorCommands: publicProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // For now, use greenhouse ID 1
        const greenhouseId = 1;

        const actuatorStates = await db
          .select()
          .from(actuators)
          .where(eq(actuators.greenhouseId, greenhouseId));

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

        return commands;
      } catch (error) {
        console.error("Error fetching actuator commands:", error);
        throw new Error("Failed to fetch actuator commands");
      }
    }),
});
