import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Droplet, Wind, Lightbulb, Thermometer, Droplets, Sun, Power, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch greenhouse data
  const greenhouse = trpc.greenhouse.getOrCreate.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  // Fetch sensor data
  const sensorData = trpc.sensor.getCurrent.useQuery(
    { greenhouseId: greenhouse.data?.id || 0 },
    { enabled: !!greenhouse.data?.id, refetchInterval: refreshInterval }
  );

  // Fetch actuators
  const actuators = trpc.actuator.getAll.useQuery(
    { greenhouseId: greenhouse.data?.id || 0 },
    { enabled: !!greenhouse.data?.id, refetchInterval: refreshInterval }
  );

  // Fetch decision history
  const decisionHistory = trpc.decision.getHistory.useQuery(
    { greenhouseId: greenhouse.data?.id || 0, limit: 10 },
    { enabled: !!greenhouse.data?.id, refetchInterval: refreshInterval * 2 }
  );

  // Fetch crops
  const crops = trpc.crop.list.useQuery();

  // Mutations
  const updateMode = trpc.greenhouse.updateMode.useMutation();
  const toggleActuator = trpc.actuator.toggle.useMutation();
  const makeDecision = trpc.decision.makeDecision.useMutation();

  // Get selected crop info
  const selectedCrop = crops.data?.find((c) => c.id === greenhouse.data?.selectedCropId);

  // Calculate days since planting
  const daysSincePlanting = greenhouse.data?.plantingDate
    ? Math.floor((Date.now() - new Date(greenhouse.data.plantingDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Get growth stage from selected crop
  const growthStage = selectedCrop && daysSincePlanting >= 0
    ? (() => {
        let accumulated = 0;
        for (const stage of selectedCrop.stages) {
          if (daysSincePlanting < accumulated + stage.duration) {
            return stage.name;
          }
          accumulated += stage.duration;
        }
        return selectedCrop.stages[selectedCrop.stages.length - 1].name;
      })()
    : "Unknown";

  // Determine sensor status colors
  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return "warning";
    return "normal";
  };

  const handleToggleMode = async () => {
    if (greenhouse.data) {
      const newMode = greenhouse.data.systemMode === "AUTO" ? "MANUAL" : "AUTO";
      await updateMode.mutateAsync({
        greenhouseId: greenhouse.data.id,
        mode: newMode,
      });
    }
  };

  const handleToggleActuator = async (actuatorId: number, currentState: number) => {
    await toggleActuator.mutateAsync({
      actuatorId,
      state: currentState === 1 ? 0 : 1,
    });
  };

  const handleMakeDecision = async () => {
    if (greenhouse.data) {
      await makeDecision.mutateAsync({
        greenhouseId: greenhouse.data.id,
      });
    }
  };

  if (!greenhouse.data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="neon-glow text-2xl">Loading greenhouse...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-pink mb-2">Smart Greenhouse</h1>
            <p className="text-sm text-muted-foreground">Real-time Monitoring & Control</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings")}
            className="cyber-button"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${greenhouse.data.cloudConnected ? "status-online cyber-pulse" : "status-offline"}`} />
          <span className="text-sm">
            {greenhouse.data.cloudConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      <hr className="cyber-divider" />

      {/* Crop Card */}
      {selectedCrop && (
        <Card className="cyber-card mb-6 p-4 hud-bracket">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Crop</p>
              <p className="text-lg font-bold neon-pink">{selectedCrop.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCrop.scientificName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stage</p>
              <p className="text-lg font-bold neon-cyan">{growthStage}</p>
              <p className="text-xs text-muted-foreground">{daysSincePlanting} days</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sensor Data Grid */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          Sensor Readings
        </h2>
        <div className="sensor-grid">
          {/* Temperature */}
          <Card className="cyber-card p-4 flex flex-col items-center justify-center text-center">
            <Thermometer className="w-6 h-6 neon-cyan mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Temperature</p>
            <p className="text-2xl font-bold neon-pink">
              {sensorData.data ? (sensorData.data.temperature / 100).toFixed(1) : "--"}°C
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sensorData.data
                ? getSensorStatus(sensorData.data.temperature / 100, 20, 30) === "warning"
                  ? "⚠ Warning"
                  : "✓ Normal"
                : ""}
            </p>
          </Card>

          {/* Humidity */}
          <Card className="cyber-card p-4 flex flex-col items-center justify-center text-center">
            <Wind className="w-6 h-6 neon-cyan mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Humidity</p>
            <p className="text-2xl font-bold neon-pink">
              {sensorData.data ? sensorData.data.humidity : "--"}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sensorData.data
                ? getSensorStatus(sensorData.data.humidity, 40, 80) === "warning"
                  ? "⚠ Warning"
                  : "✓ Normal"
                : ""}
            </p>
          </Card>

          {/* Soil Moisture */}
          <Card className="cyber-card p-4 flex flex-col items-center justify-center text-center">
            <Droplets className="w-6 h-6 neon-cyan mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Soil Moisture</p>
            <p className="text-2xl font-bold neon-pink">
              {sensorData.data ? sensorData.data.soilMoisture : "--"}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sensorData.data
                ? getSensorStatus(sensorData.data.soilMoisture, 50, 80) === "warning"
                  ? "⚠ Warning"
                  : "✓ Normal"
                : ""}
            </p>
          </Card>

          {/* Light Level */}
          <Card className="cyber-card p-4 flex flex-col items-center justify-center text-center">
            <Sun className="w-6 h-6 neon-cyan mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Light Level</p>
            <p className="text-2xl font-bold neon-pink">
              {sensorData.data ? sensorData.data.lightLevel : "--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sensorData.data
                ? getSensorStatus(sensorData.data.lightLevel, 5000, 50000) === "warning"
                  ? "⚠ Low"
                  : "✓ Good"
                : ""}
            </p>
          </Card>
        </div>
      </div>

      <hr className="cyber-divider" />

      {/* Actuator Status */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          Actuator Status
        </h2>
        <div className="space-y-2">
          {actuators.data?.map((actuator) => (
            <div key={actuator.id} className="cyber-card p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {actuator.type === "PUMP" && <Droplet className="w-5 h-5 neon-cyan" />}
                {actuator.type === "FAN" && <Wind className="w-5 h-5 neon-cyan" />}
                {actuator.type === "LIGHT" && <Lightbulb className="w-5 h-5 neon-cyan" />}
                <span className="font-semibold">{actuator.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${actuator.state === 1 ? "status-online" : "status-offline"}`} />
                <span className="text-sm">{actuator.state === 1 ? "ON" : "OFF"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="cyber-divider" />

      {/* System Mode */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">
          System Mode
        </h2>
        <div className="cyber-card p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">
              Mode: <span className="neon-cyan">{greenhouse.data.systemMode}</span>
            </span>
            <Button
              onClick={handleToggleMode}
              className="cyber-button"
              size="sm"
            >
              <Power className="w-4 h-4 mr-2" />
              Toggle
            </Button>
          </div>
          {greenhouse.data.systemMode === "MANUAL" && (
            <p className="text-xs text-yellow-400 neon-glow">
              ⚠ Manual mode active - actuators will not auto-control
            </p>
          )}
        </div>
      </div>

      {/* Manual Controls (visible only in MANUAL mode) */}
      {greenhouse.data.systemMode === "MANUAL" && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">
            Manual Controls
          </h2>
          <div className="space-y-2">
            {actuators.data?.map((actuator) => (
              <Button
                key={actuator.id}
                onClick={() => handleToggleActuator(actuator.id, actuator.state)}
                className="w-full cyber-button"
                variant="outline"
              >
                {actuator.type} - {actuator.state === 1 ? "Turn OFF" : "Turn ON"}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Decision Log */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Decision Log
          </h2>
          <Button
            onClick={handleMakeDecision}
            size="sm"
            className="cyber-button"
            disabled={makeDecision.isPending}
          >
            Run Decision
          </Button>
        </div>
        <div className="cyber-card p-4 cyber-scroll">
          {decisionHistory.data && decisionHistory.data.length > 0 ? (
            <div className="space-y-2">
              {decisionHistory.data.map((log, idx) => (
                <div key={idx} className="text-xs border-b border-border pb-2 last:border-b-0">
                  <p className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="neon-pink font-semibold">
                    {log.actuatorType} {log.action}
                  </p>
                  <p className="text-muted-foreground">{log.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No decisions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
