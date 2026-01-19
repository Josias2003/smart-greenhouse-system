import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const [, navigate] = useLocation();
  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);
  const [plantingDate, setPlantingDate] = useState<string>("");

  // Fetch greenhouse and crops
  const greenhouse = trpc.greenhouse.getOrCreate.useQuery();
  const crops = trpc.crop.list.useQuery();
  const setCrop = trpc.greenhouse.setCrop.useMutation();

  const handleSaveCrop = async () => {
    if (!greenhouse.data || !selectedCropId || !plantingDate) {
      alert("Please select a crop and planting date");
      return;
    }

    try {
      await setCrop.mutateAsync({
        greenhouseId: greenhouse.data.id,
        cropId: selectedCropId,
        plantingDate: new Date(plantingDate).getTime(),
      });
      alert("Crop settings saved!");
      navigate("/");
    } catch (error) {
      alert("Error saving crop settings");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="cyber-button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold neon-pink">Settings</h1>
      </div>

      <hr className="cyber-divider" />

      {/* Crop Selection */}
      <Card className="cyber-card p-6 mb-6">
        <h2 className="text-lg font-bold neon-cyan mb-4">Select Crop</h2>
        <div className="space-y-2 mb-4">
          {crops.data?.map((crop) => (
            <button
              key={crop.id}
              onClick={() => setSelectedCropId(crop.id)}
              className={`w-full p-3 text-left rounded border-2 transition-all ${
                selectedCropId === crop.id
                  ? "cyber-card border-accent"
                  : "border-border hover:border-accent"
              }`}
            >
              <p className="font-semibold neon-pink">{crop.name}</p>
              <p className="text-xs text-muted-foreground">{crop.scientificName}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Planting Date */}
      <Card className="cyber-card p-6 mb-6">
        <h2 className="text-lg font-bold neon-cyan mb-4">Planting Date</h2>
        <input
          type="date"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
          className="w-full p-3 bg-input border border-border rounded text-foreground"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Select the date when the crop was planted
        </p>
      </Card>

      {/* Crop Info */}
      {selectedCropId && crops.data && (
        <Card className="cyber-card p-6 mb-6">
          <h2 className="text-lg font-bold neon-cyan mb-4">Growth Stages</h2>
          <div className="space-y-3">
            {crops.data
              .find((c) => c.id === selectedCropId)
              ?.stages.map((stage: any, idx: number) => (
                <div key={idx} className="border-l-2 border-accent pl-3">
                  <p className="font-semibold neon-pink">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {stage.duration} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Temp: {stage.tempMin}°C - {stage.tempMax}°C
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Humidity: {stage.humidityMin}% - {stage.humidityMax}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Soil Moisture: {stage.soilMoistureMin}% - {stage.soilMoistureMax}%
                  </p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSaveCrop}
        className="w-full cyber-button py-6 text-lg font-bold"
        disabled={!selectedCropId || !plantingDate || setCrop.isPending}
      >
        {setCrop.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
