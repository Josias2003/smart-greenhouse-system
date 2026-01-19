import { describe, expect, it } from "vitest";
import { calculateGrowthStage, makeDecisions, hasActionChanged } from "./decisionEngine";
import type { Crop, SensorReading } from "../drizzle/schema";

describe("Decision Engine", () => {
  const maizeCrop: Crop = {
    id: 1,
    name: "Maize",
    scientificName: "Zea mays",
    stages: JSON.stringify([
      {
        name: "Initial",
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
        name: "Development",
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
        name: "Mid",
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
        name: "Late",
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
    createdAt: new Date(),
  };

  describe("calculateGrowthStage", () => {
    it("should return Initial stage for day 5", () => {
      const stages = JSON.parse(maizeCrop.stages);
      const result = calculateGrowthStage(stages, 5);
      expect(result.stageName).toBe("Initial");
      expect(result.daysInStage).toBe(5);
    });

    it("should return Development stage for day 20", () => {
      const stages = JSON.parse(maizeCrop.stages);
      const result = calculateGrowthStage(stages, 20);
      expect(result.stageName).toBe("Development");
      expect(result.daysInStage).toBe(6); // 20 - 14 = 6
    });

    it("should return Mid stage for day 47", () => {
      const stages = JSON.parse(maizeCrop.stages);
      const result = calculateGrowthStage(stages, 47);
      expect(result.stageName).toBe("Mid");
      expect(result.daysInStage).toBe(13); // 47 - 14 - 20 = 13
    });

    it("should return Late stage for day 80", () => {
      const stages = JSON.parse(maizeCrop.stages);
      const result = calculateGrowthStage(stages, 80);
      expect(result.stageName).toBe("Late");
    });
  });

  describe("makeDecisions", () => {
    it("should turn on pump when soil moisture is below threshold", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500, // 25°C
        humidity: 65,
        soilMoisture: 22, // Below Mid stage threshold of 60%
        lightLevel: 8000,
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47); // Mid stage
      expect(result.pump.action).toBe("ON");
      expect(result.pump.reason).toContain("soil moisture 22%");
      expect(result.growthStage).toBe("Mid");
    });

    it("should turn off pump when soil moisture is above threshold", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500,
        humidity: 65,
        soilMoisture: 85, // Above Mid stage threshold of 60%
        lightLevel: 8000,
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.pump.action).toBe("OFF");
    });

    it("should turn on fan when temperature exceeds max", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 3600, // 36°C, exceeds Mid stage max of 35°C
        humidity: 65,
        soilMoisture: 70,
        lightLevel: 8000,
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.fan.action).toBe("ON");
      expect(result.fan.reason).toContain("36.0°C > max 35°C");
    });

    it("should turn on fan when humidity exceeds max", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500,
        humidity: 95, // Exceeds Mid stage max of 90%
        soilMoisture: 70,
        lightLevel: 8000,
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.fan.action).toBe("ON");
      expect(result.fan.reason).toContain("Humidity 95%");
    });

    it("should turn on light when light level is low", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500,
        humidity: 65,
        soilMoisture: 70,
        lightLevel: 2000, // Below threshold of 5000
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.light.action).toBe("ON");
      expect(result.light.reason).toContain("Light level 2000");
    });

    it("should turn off light when light level is adequate", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500,
        humidity: 65,
        soilMoisture: 70,
        lightLevel: 8000, // Above threshold
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.light.action).toBe("OFF");
    });

    it("should include crop name and stage in reason", () => {
      const sensorReading: SensorReading = {
        id: 1,
        greenhouseId: 1,
        temperature: 2500,
        humidity: 65,
        soilMoisture: 22,
        lightLevel: 8000,
        timestamp: new Date(),
      };

      const result = makeDecisions(maizeCrop, sensorReading, 47);
      expect(result.pump.reason).toContain("Maize");
      expect(result.pump.reason).toContain("Mid");
    });
  });

  describe("hasActionChanged", () => {
    it("should return true when action changes from OFF to ON", () => {
      expect(hasActionChanged("OFF", "ON")).toBe(true);
    });

    it("should return true when action changes from ON to OFF", () => {
      expect(hasActionChanged("ON", "OFF")).toBe(true);
    });

    it("should return false when action remains the same", () => {
      expect(hasActionChanged("ON", "ON")).toBe(false);
      expect(hasActionChanged("OFF", "OFF")).toBe(false);
    });

    it("should return true when previous action is null", () => {
      expect(hasActionChanged(null, "ON")).toBe(true);
      expect(hasActionChanged(null, "OFF")).toBe(true);
    });
  });
});
