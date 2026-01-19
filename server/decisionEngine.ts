import { Crop, SensorReading } from "../drizzle/schema";

export interface CropStage {
  name: string;
  duration: number;
  kc: number;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
}

export interface DecisionResult {
  pump: { action: "ON" | "OFF"; reason: string };
  fan: { action: "ON" | "OFF"; reason: string };
  light: { action: "ON" | "OFF"; reason: string };
  growthStage: string;
  daysSincePlanting: number;
}

/**
 * Calculate the current growth stage based on days since planting
 */
export function calculateGrowthStage(
  stages: CropStage[],
  daysSincePlanting: number
): { stage: CropStage; stageName: string; daysInStage: number } {
  let accumulatedDays = 0;
  let currentStage = stages[stages.length - 1]; // Default to last stage
  let daysInStage = daysSincePlanting;

  for (const stage of stages) {
    const stageEnd = accumulatedDays + stage.duration;
    if (daysSincePlanting < stageEnd) {
      currentStage = stage;
      daysInStage = daysSincePlanting - accumulatedDays;
      break;
    }
    accumulatedDays = stageEnd;
  }

  return {
    stage: currentStage,
    stageName: currentStage.name,
    daysInStage,
  };
}

/**
 * Apply rule-based logic to determine actuator actions
 */
export function makeDecisions(
  crop: Crop,
  sensorReading: SensorReading,
  daysSincePlanting: number
): DecisionResult {
  const stages: CropStage[] = JSON.parse(crop.stages);
  const { stage, stageName } = calculateGrowthStage(stages, daysSincePlanting);

  // Convert temperature from stored format (e.g., 2500 = 25.00°C)
  const tempCelsius = sensorReading.temperature / 100;
  const humidity = sensorReading.humidity;
  const soilMoisture = sensorReading.soilMoisture;
  const lightLevel = sensorReading.lightLevel;

  // ============ PUMP DECISION ============
  let pumpAction: "ON" | "OFF" = "OFF";
  let pumpReason = "";

  if (soilMoisture < stage.soilMoistureMin) {
    pumpAction = "ON";
    pumpReason = `${crop.name} (${stageName}), soil moisture ${soilMoisture}% < threshold ${stage.soilMoistureMin}%`;
  } else if (soilMoisture > stage.soilMoistureMax) {
    pumpAction = "OFF";
    pumpReason = `${crop.name} (${stageName}), soil moisture ${soilMoisture}% > max ${stage.soilMoistureMax}%`;
  } else {
    pumpAction = "OFF";
    pumpReason = `${crop.name} (${stageName}), soil moisture ${soilMoisture}% within range`;
  }

  // ============ FAN DECISION ============
  let fanAction: "ON" | "OFF" = "OFF";
  let fanReason = "";

  if (tempCelsius > stage.tempMax) {
    fanAction = "ON";
    fanReason = `Temperature ${tempCelsius.toFixed(1)}°C > max ${stage.tempMax}°C`;
  } else if (humidity > stage.humidityMax) {
    fanAction = "ON";
    fanReason = `Humidity ${humidity}% > max ${stage.humidityMax}%`;
  } else if (tempCelsius < stage.tempMin) {
    fanAction = "OFF";
    fanReason = `Temperature ${tempCelsius.toFixed(1)}°C < min ${stage.tempMin}°C`;
  } else if (humidity < stage.humidityMin) {
    fanAction = "OFF";
    fanReason = `Humidity ${humidity}% < min ${stage.humidityMin}%`;
  } else {
    fanAction = "OFF";
    fanReason = `${crop.name} (${stageName}), conditions optimal`;
  }

  // ============ LIGHT DECISION ============
  let lightAction: "ON" | "OFF" = "OFF";
  let lightReason = "";

  // Light threshold: turn on if light level is low (< 5000 lux, assuming relative scale)
  const lightThreshold = 5000;
  if (lightLevel < lightThreshold) {
    lightAction = "ON";
    lightReason = `Light level ${lightLevel} < threshold ${lightThreshold}`;
  } else {
    lightAction = "OFF";
    lightReason = `Light level ${lightLevel} adequate`;
  }

  return {
    pump: { action: pumpAction, reason: pumpReason },
    fan: { action: fanAction, reason: fanReason },
    light: { action: lightAction, reason: lightReason },
    growthStage: stageName,
    daysSincePlanting,
  };
}

/**
 * Determine if an action has changed from previous state
 */
export function hasActionChanged(
  previousAction: "ON" | "OFF" | null,
  newAction: "ON" | "OFF"
): boolean {
  if (previousAction === null) return true;
  return previousAction !== newAction;
}
