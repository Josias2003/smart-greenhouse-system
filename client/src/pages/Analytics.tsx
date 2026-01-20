import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function Analytics() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  // Get greenhouse data
  const greenhouseQuery = trpc.greenhouse.getOrCreate.useQuery();
  const greenhouse = greenhouseQuery.data;

  // Get sensor readings
  const readingsQuery = trpc.esp32.getLatestReadings.useQuery(
    greenhouse ? { greenhouseId: greenhouse.id } : skipToken
  );

  // Get aggregated statistics
  const statsQuery = trpc.esp32.getAggregatedStats.useQuery(
    greenhouse
      ? {
          greenhouseId: greenhouse.id,
          period: timeRange === "24h" ? "hour" : timeRange === "7d" ? "day" : "month",
        }
      : skipToken
  );

  // Get decision history
  const decisionQuery = trpc.decision.getHistory.useQuery(
    greenhouse ? { greenhouseId: greenhouse.id, limit: 20 } : skipToken
  );

  // Process readings for charts
  const chartData = useMemo(() => {
    if (!readingsQuery.data) return [];

    return readingsQuery.data
      .slice()
      .reverse()
      .map((reading) => ({
        timestamp: new Date(reading.timestamp).toLocaleTimeString(),
        temperature: (reading.temperature / 100).toFixed(1),
        humidity: reading.humidity,
        soilMoisture: reading.soilMoisture,
        lightLevel: (reading.lightLevel / 100).toFixed(0),
      }));
  }, [readingsQuery.data]);

  // Process decision frequency
  const decisionFrequency = useMemo(() => {
    if (!decisionQuery.data) return [];

    const frequency: Record<string, number> = {
      PUMP: 0,
      FAN: 0,
      LIGHT: 0,
    };

    decisionQuery.data.forEach((decision) => {
      frequency[decision.actuatorType] = (frequency[decision.actuatorType] || 0) + 1;
    });

    return [
      { name: "Pump", value: frequency.PUMP },
      { name: "Fan", value: frequency.FAN },
      { name: "Light", value: frequency.LIGHT },
    ];
  }, [decisionQuery.data]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-cyan-400 hover:text-pink-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 neon-glow">
            Analytics
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {(["24h", "7d", "30d"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            className={
              timeRange === range
                ? "bg-cyan-400 text-black hover:bg-cyan-500"
                : "border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            }
          >
            {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : "30 Days"}
          </Button>
        ))}
      </div>

      {/* Statistics Cards */}
      {statsQuery.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-cyan-400/50 bg-black/50 p-4">
            <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
              Avg Temperature
            </div>
            <div className="text-2xl font-bold text-pink-400 neon-glow">
              {statsQuery.data.temperature.avg.toFixed(1)}°C
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsQuery.data.temperature.min.toFixed(1)}° - {statsQuery.data.temperature.max.toFixed(1)}°
            </div>
          </Card>

          <Card className="border-cyan-400/50 bg-black/50 p-4">
            <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
              Avg Humidity
            </div>
            <div className="text-2xl font-bold text-pink-400 neon-glow">
              {statsQuery.data.humidity.avg.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsQuery.data.humidity.min.toFixed(0)}% - {statsQuery.data.humidity.max.toFixed(0)}%
            </div>
          </Card>

          <Card className="border-cyan-400/50 bg-black/50 p-4">
            <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
              Avg Soil Moisture
            </div>
            <div className="text-2xl font-bold text-pink-400 neon-glow">
              {statsQuery.data.soilMoisture.avg.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {statsQuery.data.soilMoisture.min.toFixed(0)}% - {statsQuery.data.soilMoisture.max.toFixed(0)}%
            </div>
          </Card>

          <Card className="border-cyan-400/50 bg-black/50 p-4">
            <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
              Avg Light Level
            </div>
            <div className="text-2xl font-bold text-pink-400 neon-glow">
              {(statsQuery.data.lightLevel.avg / 100).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(statsQuery.data.lightLevel.min / 100).toFixed(0)}k - {(statsQuery.data.lightLevel.max / 100).toFixed(0)}k
            </div>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Temperature Trend */}
        <Card className="border-cyan-400/50 bg-black/50 p-4">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
            Temperature Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis stroke="#666" style={{ fontSize: "12px" }} />
                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0ff" }}
                  labelStyle={{ color: "#0ff" }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ec4899"
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Humidity Trend */}
        <Card className="border-cyan-400/50 bg-black/50 p-4">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
            Humidity Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis stroke="#666" style={{ fontSize: "12px" }} />
                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0ff" }}
                  labelStyle={{ color: "#0ff" }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#00ffff"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Soil Moisture Trend */}
        <Card className="border-cyan-400/50 bg-black/50 p-4">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
            Soil Moisture Trend
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis stroke="#666" style={{ fontSize: "12px" }} />
                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0ff" }}
                  labelStyle={{ color: "#0ff" }}
                />
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke="#00ff88"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Decision Frequency */}
        <Card className="border-cyan-400/50 bg-black/50 p-4">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
            Decision Frequency
          </h3>
          {decisionFrequency.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={decisionFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis stroke="#666" style={{ fontSize: "12px" }} />
                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #0ff" }}
                  labelStyle={{ color: "#0ff" }}
                />
                <Bar dataKey="value" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>

      {/* Recent Decisions */}
      <Card className="border-cyan-400/50 bg-black/50 p-4">
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Recent Decisions
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {decisionQuery.data && decisionQuery.data.length > 0 ? (
            decisionQuery.data.map((decision, idx) => (
              <div
                key={idx}
                className="p-3 border border-cyan-400/30 rounded bg-black/30 hover:bg-black/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-pink-400">
                    {decision.actuatorType}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      decision.action === "ON"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {decision.action}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{decision.reason}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(decision.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No decisions yet</div>
          )}
        </div>
      </Card>
    </div>
  );
}
