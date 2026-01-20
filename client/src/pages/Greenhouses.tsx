import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Greenhouses Management Page
 * Allows users to create, select, and manage multiple greenhouses
 * 
 * Future features:
 * - Create new greenhouses
 * - Delete greenhouses
 * - Rename greenhouses
 * - View greenhouse statistics
 * - Compare multiple greenhouses
 */
export default function Greenhouses() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGreenhouseName, setNewGreenhouseName] = useState("");

  // Mock data for demonstration
  const mockGreenhouses = [
    {
      id: 1,
      name: "Main Greenhouse",
      crop: "Maize",
      status: "Active",
      temperature: 25.3,
      humidity: 65,
      soilMoisture: 76,
    },
    {
      id: 2,
      name: "Secondary Greenhouse",
      crop: "Tomato",
      status: "Active",
      temperature: 24.8,
      humidity: 62,
      soilMoisture: 68,
    },
    {
      id: 3,
      name: "Experimental Greenhouse",
      crop: "Coffee",
      status: "Monitoring",
      temperature: 22.1,
      humidity: 58,
      soilMoisture: 72,
    },
  ];

  const handleCreateGreenhouse = () => {
    if (newGreenhouseName.trim()) {
      console.log("Creating greenhouse:", newGreenhouseName);
      setNewGreenhouseName("");
      setShowCreateForm(false);
      // TODO: Call API to create greenhouse
    }
  };

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
            Greenhouses
          </h1>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-cyan-400 text-black hover:bg-cyan-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Greenhouse
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-cyan-400/50 bg-black/50 p-6 mb-6">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4">Create New Greenhouse</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Greenhouse name (e.g., 'North Field')"
              value={newGreenhouseName}
              onChange={(e) => setNewGreenhouseName(e.target.value)}
              className="bg-black/50 border-cyan-400/30 text-foreground placeholder:text-gray-600"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGreenhouse();
              }}
            />
            <Button
              onClick={handleCreateGreenhouse}
              className="bg-green-500 text-black hover:bg-green-600"
            >
              Create
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="outline"
              className="border-gray-600 text-gray-400"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Greenhouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockGreenhouses.map((greenhouse) => (
          <Card
            key={greenhouse.id}
            className="border-cyan-400/50 bg-black/50 p-6 cursor-pointer hover:border-pink-400/50 hover:bg-black/70 transition-all group"
            onClick={() => navigate("/")}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-pink-400 group-hover:text-cyan-400 transition-colors">
                  {greenhouse.name}
                </h3>
                <p className="text-sm text-gray-500">{greenhouse.crop}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Delete greenhouse:", greenhouse.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  greenhouse.status === "Active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {greenhouse.status}
              </span>
            </div>

            {/* Sensor Data */}
            <div className="space-y-2 border-t border-cyan-400/20 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Temperature</span>
                <span className="text-cyan-400 font-semibold">{greenhouse.temperature}°C</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Humidity</span>
                <span className="text-cyan-400 font-semibold">{greenhouse.humidity}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Soil Moisture</span>
                <span className="text-cyan-400 font-semibold">{greenhouse.soilMoisture}%</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full mt-4 bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/50"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/");
              }}
            >
              View Dashboard
            </Button>
          </Card>
        ))}
      </div>

      {/* Comparative Analytics (Future) */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 neon-glow mb-4">
          Comparative Analytics
        </h2>
        <Card className="border-cyan-400/50 bg-black/50 p-6">
          <p className="text-gray-400">
            Compare sensor data, growth rates, and decision patterns across multiple greenhouses.
            This feature will be available soon.
          </p>
          <Button
            disabled
            className="mt-4 bg-gray-600 text-gray-400 cursor-not-allowed"
          >
            Coming Soon
          </Button>
        </Card>
      </div>
    </div>
  );
}
