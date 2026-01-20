import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { esp32Router } from "./routers/esp32";

export const appRouter = router({
  system: systemRouter,
  esp32: esp32Router,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  greenhouse: router({
    getOrCreate: protectedProcedure.query(async ({ ctx }) => {
      const { getGreenhouseByUserId, createGreenhouse } = await import("./db");
      let greenhouse = await getGreenhouseByUserId(ctx.user.id);
      if (!greenhouse) {
        greenhouse = await createGreenhouse(ctx.user.id, "Main Greenhouse");
      }
      return greenhouse;
    }),

    updateMode: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val && "mode" in val) {
          const obj = val as { greenhouseId: number; mode: "AUTO" | "MANUAL" };
          return obj;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateGreenhouseMode } = await import("./db");
        await updateGreenhouseMode(input.greenhouseId, input.mode);
        return { success: true };
      }),

    setCrop: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val && "cropId" in val && "plantingDate" in val) {
          const obj = val as { greenhouseId: number; cropId: number; plantingDate: number };
          return obj;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateGreenhouseCrop } = await import("./db");
        await updateGreenhouseCrop(input.greenhouseId, input.cropId, new Date(input.plantingDate));
        return { success: true };
      }),
  }),

  crop: router({
    list: publicProcedure.query(async () => {
      const { getAllCrops } = await import("./db");
      const allCrops = await getAllCrops();
      return allCrops.map((crop) => ({
        ...crop,
        stages: JSON.parse(crop.stages),
      }));
    }),
  }),

  sensor: router({
    getCurrent: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val) {
          return val as { greenhouseId: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getLatestSensorReading } = await import("./db");
        const reading = await getLatestSensorReading(input.greenhouseId);
        if (!reading) return null;
        return {
          ...reading,
          temperatureCelsius: reading.temperature / 100,
        };
      }),

    recordReading: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val) {
          const obj = val as {
            greenhouseId: number;
            temperature: number;
            humidity: number;
            soilMoisture: number;
            lightLevel: number;
          };
          return obj;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { insertSensorReading } = await import("./db");
        await insertSensorReading(
          input.greenhouseId,
          input.temperature,
          input.humidity,
          input.soilMoisture,
          input.lightLevel
        );
        return { success: true };
      }),
  }),

  actuator: router({
    getAll: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val) {
          return val as { greenhouseId: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getActuatorsByGreenhouse } = await import("./db");
        return await getActuatorsByGreenhouse(input.greenhouseId);
      }),

    toggle: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "actuatorId" in val && "state" in val) {
          return val as { actuatorId: number; state: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateActuatorState } = await import("./db");
        await updateActuatorState(input.actuatorId, input.state);
        return { success: true };
      }),
  }),

  decision: router({
    getHistory: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val) {
          const obj = val as { greenhouseId: number; limit?: number };
          return obj;
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getDecisionHistory } = await import("./db");
        return await getDecisionHistory(input.greenhouseId, input.limit ?? 10);
      }),

    makeDecision: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "greenhouseId" in val) {
          const obj = val as { greenhouseId: number };
          return obj;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const {
          getGreenhouseByUserId,
          getLatestSensorReading,
          getCropById,
          logDecision,
          getOrCreateActuator,
          updateActuatorState,
        } = await import("./db");
        const { makeDecisions } = await import("./decisionEngine");

        const greenhouse = await getGreenhouseByUserId(input.greenhouseId);
        if (!greenhouse || !greenhouse.selectedCropId || !greenhouse.plantingDate) {
          return { success: false, error: "Greenhouse not properly configured" };
        }

        const sensorReading = await getLatestSensorReading(input.greenhouseId);
        if (!sensorReading) {
          return { success: false, error: "No sensor data available" };
        }

        const crop = await getCropById(greenhouse.selectedCropId);
        if (!crop) {
          return { success: false, error: "Crop not found" };
        }

        const daysSincePlanting = Math.floor(
          (Date.now() - greenhouse.plantingDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const decisions = makeDecisions(crop, sensorReading, daysSincePlanting);

        const actuatorTypes: ("PUMP" | "FAN" | "LIGHT")[] = ["PUMP", "FAN", "LIGHT"];
        for (const type of actuatorTypes) {
          const decision = decisions[type.toLowerCase() as "pump" | "fan" | "light"];
          const actuator = await getOrCreateActuator(input.greenhouseId, type);
          const newState = decision.action === "ON" ? 1 : 0;

          if (greenhouse.systemMode === "AUTO" && actuator.state !== newState) {
            await updateActuatorState(actuator.id, newState);
          }

          await logDecision(
            input.greenhouseId,
            type,
            decision.action,
            decision.reason,
            crop.name,
            decisions.growthStage,
            {
              temperature: sensorReading.temperature / 100,
              humidity: sensorReading.humidity,
              soilMoisture: sensorReading.soilMoisture,
              lightLevel: sensorReading.lightLevel,
            }
          );
        }

        return {
          success: true,
          decisions,
          daysSincePlanting,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
