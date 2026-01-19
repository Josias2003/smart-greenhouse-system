import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, crops, greenhouses, sensorReadings, actuators, decisionLogs, Crop, Greenhouse, SensorReading, Actuator, DecisionLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Crop Functions ============

export async function getAllCrops(): Promise<Crop[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(crops);
}

export async function getCropById(cropId: number): Promise<Crop | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(crops).where(eq(crops.id, cropId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Greenhouse Functions ============

export async function getGreenhouseByUserId(userId: number): Promise<Greenhouse | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(greenhouses).where(eq(greenhouses.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createGreenhouse(userId: number, name: string): Promise<Greenhouse> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(greenhouses).values({
    userId,
    name,
    systemMode: "AUTO",
  });
  
  const id = Number((result as any).insertId);
  const greenhouse = await db.select().from(greenhouses).where(eq(greenhouses.id, id)).limit(1);
  if (!greenhouse[0]) throw new Error("Failed to create greenhouse");
  return greenhouse[0];
}

export async function updateGreenhouseMode(greenhouseId: number, mode: "AUTO" | "MANUAL"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(greenhouses).set({ systemMode: mode }).where(eq(greenhouses.id, greenhouseId));
}

export async function updateGreenhouseCrop(greenhouseId: number, cropId: number, plantingDate: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(greenhouses).set({ selectedCropId: cropId, plantingDate }).where(eq(greenhouses.id, greenhouseId));
}

// ============ Sensor Functions ============

export async function getLatestSensorReading(greenhouseId: number): Promise<SensorReading | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.greenhouseId, greenhouseId))
    .orderBy(desc(sensorReadings.timestamp))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function insertSensorReading(
  greenhouseId: number,
  temperature: number,
  humidity: number,
  soilMoisture: number,
  lightLevel: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sensorReadings).values({
    greenhouseId,
    temperature,
    humidity,
    soilMoisture,
    lightLevel,
  });
}

export async function getSensorHistory(greenhouseId: number, limit: number = 100): Promise<SensorReading[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(sensorReadings)
    .where(eq(sensorReadings.greenhouseId, greenhouseId))
    .orderBy(desc(sensorReadings.timestamp))
    .limit(limit);
}

// ============ Actuator Functions ============

export async function getActuatorsByGreenhouse(greenhouseId: number): Promise<Actuator[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(actuators).where(eq(actuators.greenhouseId, greenhouseId));
}

export async function getOrCreateActuator(
  greenhouseId: number,
  type: "PUMP" | "FAN" | "LIGHT"
): Promise<Actuator> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(actuators)
    .where(and(eq(actuators.greenhouseId, greenhouseId), eq(actuators.type, type)))
    .limit(1);
  
  if (existing.length > 0) return existing[0];
  
  const result = await db.insert(actuators).values({
    greenhouseId,
    type,
    state: 0,
  });
  
  const id = Number((result as any).insertId);
  const actuator = await db.select().from(actuators).where(eq(actuators.id, id)).limit(1);
  if (!actuator[0]) throw new Error("Failed to create actuator");
  return actuator[0];
}

export async function updateActuatorState(actuatorId: number, state: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(actuators).set({ state, lastToggled: new Date() }).where(eq(actuators.id, actuatorId));
}

// ============ Decision Log Functions ============

export async function logDecision(
  greenhouseId: number,
  actuatorType: "PUMP" | "FAN" | "LIGHT",
  action: "ON" | "OFF",
  reason: string,
  cropName?: string,
  growthStage?: string,
  sensorValues?: Record<string, number>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(decisionLogs).values({
    greenhouseId,
    actuatorType,
    action,
    reason,
    cropName,
    growthStage,
    sensorValues: sensorValues ? JSON.stringify(sensorValues) : undefined,
  });
}

export async function getDecisionHistory(greenhouseId: number, limit: number = 10): Promise<DecisionLog[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(decisionLogs)
    .where(eq(decisionLogs.greenhouseId, greenhouseId))
    .orderBy(desc(decisionLogs.timestamp))
    .limit(limit);
}
