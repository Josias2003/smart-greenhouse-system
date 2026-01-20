/*
 * Smart Greenhouse ESP32 Firmware
 * 
 * This sketch reads environmental sensors and sends data to the cloud backend
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - DHT22 Temperature & Humidity Sensor (GPIO 4)
 * - Capacitive Soil Moisture Sensor (GPIO 34 - ADC)
 * - Light Intensity Sensor (GPIO 35 - ADC)
 * - 3x Relay Modules for Pump, Fan, Light (GPIO 12, 13, 14)
 * 
 * Wiring Diagram:
 * ┌─────────────────────────────────────────┐
 * │           ESP32 DevKit                  │
 * ├─────────────────────────────────────────┤
 * │ GPIO 4  → DHT22 Data Pin                │
 * │ GPIO 12 → Pump Relay Signal             │
 * │ GPIO 13 → Fan Relay Signal              │
 * │ GPIO 14 → Light Relay Signal            │
 * │ GPIO 34 → Soil Moisture Sensor (ADC)    │
 * │ GPIO 35 → Light Sensor (ADC)            │
 * │ GND     → Common Ground                 │
 * │ 5V      → Power Supply                  │
 * └─────────────────────────────────────────┘
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ===== WiFi Configuration =====
const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// ===== Cloud Backend Configuration =====
const char* BACKEND_URL = "https://your-domain.manus.space/api/trpc/greenhouse.ingestSensorData";
const char* DEVICE_ID = "esp32-greenhouse-001";
const char* DEVICE_TOKEN = "your-device-token-here";

// ===== Pin Configuration =====
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PUMP_PIN 12
#define FAN_PIN 13
#define LIGHT_PIN 14
#define SOIL_MOISTURE_PIN 34
#define LIGHT_SENSOR_PIN 35

// ===== Sensor Objects =====
DHT dht(DHT_PIN, DHT_TYPE);

// ===== Timing Configuration =====
const unsigned long SENSOR_READ_INTERVAL = 60000;  // Read sensors every 60 seconds
const unsigned long CLOUD_SYNC_INTERVAL = 300000;  // Send to cloud every 5 minutes
unsigned long lastSensorRead = 0;
unsigned long lastCloudSync = 0;

// ===== Sensor Data Structure =====
struct SensorData {
  float temperature;
  float humidity;
  int soilMoisture;
  int lightLevel;
  unsigned long timestamp;
};

SensorData currentData;

// ===== Function Prototypes =====
void setupWiFi();
void readSensors();
void sendToCloud();
void controlActuators();
int readSoilMoisture();
int readLightLevel();
void logData(String message);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  logData("Starting Smart Greenhouse ESP32 Firmware...");
  
  // Initialize pins
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  
  // Turn off all actuators initially
  digitalWrite(PUMP_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(LIGHT_PIN, LOW);
  
  // Initialize DHT sensor
  dht.begin();
  delay(2000);
  
  // Connect to WiFi
  setupWiFi();
  
  logData("Setup complete!");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    logData("WiFi disconnected, attempting to reconnect...");
    setupWiFi();
  }
  
  // Read sensors at specified interval
  if (millis() - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensors();
    lastSensorRead = millis();
  }
  
  // Send data to cloud at specified interval
  if (millis() - lastCloudSync >= CLOUD_SYNC_INTERVAL) {
    sendToCloud();
    lastCloudSync = millis();
  }
  
  delay(1000);
}

void setupWiFi() {
  logData("Connecting to WiFi: " + String(WIFI_SSID));
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    logData("WiFi connected! IP: " + WiFi.localIP().toString());
  } else {
    logData("Failed to connect to WiFi");
  }
}

void readSensors() {
  logData("Reading sensors...");
  
  // Read DHT22
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (isnan(h) || isnan(t)) {
    logData("Failed to read DHT22 sensor!");
    return;
  }
  
  // Read soil moisture (0-4095 ADC, convert to 0-100%)
  int soilRaw = readSoilMoisture();
  int soilPercent = map(soilRaw, 0, 4095, 0, 100);
  
  // Read light level (0-4095 ADC, convert to 0-10000 lux)
  int lightRaw = readLightLevel();
  int lightLux = map(lightRaw, 0, 4095, 0, 10000);
  
  // Store data
  currentData.temperature = t;
  currentData.humidity = h;
  currentData.soilMoisture = soilPercent;
  currentData.lightLevel = lightLux;
  currentData.timestamp = millis();
  
  // Log to serial
  Serial.printf("Temp: %.1f°C, Humidity: %.1f%%, Soil: %d%%, Light: %d lux\n",
                currentData.temperature, currentData.humidity,
                currentData.soilMoisture, currentData.lightLevel);
}

int readSoilMoisture() {
  int sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SOIL_MOISTURE_PIN);
    delay(10);
  }
  return sum / 10;  // Average of 10 readings
}

int readLightLevel() {
  int sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(LIGHT_SENSOR_PIN);
    delay(10);
  }
  return sum / 10;  // Average of 10 readings
}

void sendToCloud() {
  if (WiFi.status() != WL_CONNECTED) {
    logData("WiFi not connected, skipping cloud sync");
    return;
  }
  
  logData("Sending data to cloud...");
  
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(DEVICE_TOKEN));
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = currentData.temperature;
  doc["humidity"] = currentData.humidity;
  doc["soilMoisture"] = currentData.soilMoisture;
  doc["lightLevel"] = currentData.lightLevel;
  doc["timestamp"] = currentData.timestamp;
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    logData("Data sent successfully!");
    
    // Parse response for actuator commands
    String response = http.getString();
    StaticJsonDocument<256> responseDoc;
    deserializeJson(responseDoc, response);
    
    // Apply actuator commands if provided
    if (responseDoc.containsKey("actuators")) {
      JsonObject actuators = responseDoc["actuators"];
      if (actuators.containsKey("pump")) {
        digitalWrite(PUMP_PIN, actuators["pump"] ? HIGH : LOW);
      }
      if (actuators.containsKey("fan")) {
        digitalWrite(FAN_PIN, actuators["fan"] ? HIGH : LOW);
      }
      if (actuators.containsKey("light")) {
        digitalWrite(LIGHT_PIN, actuators["light"] ? HIGH : LOW);
      }
    }
  } else {
    logData("Failed to send data. HTTP code: " + String(httpCode));
  }
  
  http.end();
}

void logData(String message) {
  String timestamp = String(millis() / 1000);
  Serial.println("[" + timestamp + "] " + message);
}

/*
 * CALIBRATION GUIDE
 * 
 * Soil Moisture Sensor:
 * 1. Place sensor in dry soil, note ADC value
 * 2. Place sensor in fully saturated soil, note ADC value
 * 3. Use map() function to convert ADC range to 0-100%
 * 
 * Light Sensor:
 * 1. Measure light level with lux meter in known conditions
 * 2. Note corresponding ADC values
 * 3. Create calibration curve
 * 
 * DHT22:
 * - Typically accurate within ±2°C and ±2% RH
 * - Allow 2 seconds between readings
 */
