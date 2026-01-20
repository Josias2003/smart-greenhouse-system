#!/usr/bin/env python3
import csv
import json
from pathlib import Path

# Read the Rwanda crop data CSV
csv_path = Path("/home/ubuntu/upload/rwanda_comprehensive_crop_data.csv")
crops_data = []

with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        crops_data.append(row)

print(f"✓ Loaded {len(crops_data)} crops from CSV\n")

# Analyze data completeness
missing_fields = {}
for crop in crops_data:
    for key, value in crop.items():
        if not value or value.strip() == "":
            if key not in missing_fields:
                missing_fields[key] = []
            missing_fields[key].append(crop['Crop'])

if missing_fields:
    print("⚠ Missing or incomplete data:")
    for field, crops_list in missing_fields.items():
        print(f"  {field}: {', '.join(crops_list)}")
else:
    print("✓ All fields have data")

print("\n" + "="*60)
print("CROP DATA SUMMARY")
print("="*60)

# Display all crops with their parameters
for i, crop in enumerate(crops_data, 1):
    print(f"\n{i}. {crop['Crop']} ({crop['Scientific Name']})")
    print(f"   Temp: {crop['Temp_Min_C']}°C - {crop['Temp_Max_C']}°C")
    print(f"   Humidity: {crop['Humidity']}")
    print(f"   Light: {crop['Light']}")
    print(f"   Kc: {crop['Kc_ini']} (ini) → {crop['Kc_mid']} (mid) → {crop['Kc_late']} (late)")
    print(f"   Stages: {crop['Stage_ini_days']}d (ini) → {crop['Stage_dev_days']}d (dev) → {crop['Stage_mid_days']}d (mid) → {crop['Stage_late_days']}d (late)")

# Create JSON format for database insertion
print("\n" + "="*60)
print("PROCESSING FOR DATABASE")
print("="*60)

# Map humidity and light descriptions to ranges
humidity_map = {
    "Low": (20, 40),
    "Low-Medium": (30, 50),
    "Medium": (40, 70),
    "Medium-High": (50, 80),
    "High": (70, 90),
    "Very High": (80, 95),
}

light_map = {
    "Very Bright (Full Sun)": "Full Sun",
    "Bright": "Bright",
    "Partial Shade/Bright": "Partial Shade",
    "Partial Shade": "Partial Shade",
}

processed_crops = []
for crop in crops_data:
    # Parse humidity
    humidity_desc = crop['Humidity'].strip()
    if humidity_desc in humidity_map:
        humidity_min, humidity_max = humidity_map[humidity_desc]
    else:
        print(f"⚠ Unknown humidity description for {crop['Crop']}: {humidity_desc}")
        humidity_min, humidity_max = 40, 70  # Default

    # Parse light
    light_desc = crop['Light'].strip()
    light_category = light_map.get(light_desc, "Bright")

    # Create stages array
    stages = [
        {
            "name": "Initial",
            "duration": int(crop['Stage_ini_days']),
            "kc": float(crop['Kc_ini']),
            "tempMin": int(crop['Temp_Min_C']),
            "tempMax": int(crop['Temp_Max_C']),
            "humidityMin": humidity_min,
            "humidityMax": humidity_max,
            "soilMoistureMin": 40,  # Default values
            "soilMoistureMax": 100,
        },
        {
            "name": "Development",
            "duration": int(crop['Stage_dev_days']),
            "kc": (float(crop['Kc_ini']) + float(crop['Kc_mid'])) / 2,
            "tempMin": int(crop['Temp_Min_C']),
            "tempMax": int(crop['Temp_Max_C']),
            "humidityMin": humidity_min,
            "humidityMax": humidity_max,
            "soilMoistureMin": 50,
            "soilMoistureMax": 100,
        },
        {
            "name": "Mid",
            "duration": int(crop['Stage_mid_days']),
            "kc": float(crop['Kc_mid']),
            "tempMin": int(crop['Temp_Min_C']),
            "tempMax": int(crop['Temp_Max_C']),
            "humidityMin": humidity_min,
            "humidityMax": humidity_max,
            "soilMoistureMin": 60,
            "soilMoistureMax": 100,
        },
        {
            "name": "Late",
            "duration": int(crop['Stage_late_days']),
            "kc": float(crop['Kc_late']),
            "tempMin": int(crop['Temp_Min_C']),
            "tempMax": int(crop['Temp_Max_C']),
            "humidityMin": humidity_min,
            "humidityMax": humidity_max,
            "soilMoistureMin": 40,
            "soilMoistureMax": 80,
        },
    ]

    processed_crops.append({
        "name": crop['Crop'],
        "scientificName": crop['Scientific Name'],
        "stages": stages,
        "light": light_category,
    })

# Save processed data
output_path = Path("/home/ubuntu/smart-greenhouse-system/rwanda_crops_processed.json")
with open(output_path, 'w') as f:
    json.dump(processed_crops, f, indent=2)

print(f"✓ Processed {len(processed_crops)} crops")
print(f"✓ Saved to {output_path}")
