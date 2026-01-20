# Smart Greenhouse Monitoring System - Project TODO

## Database & Schema
- [x] Create greenhouse, sensor, actuator, crop, and decision_log tables
- [x] Implement crop knowledge base with stage parameters (Kc, thresholds)
- [x] Add user settings table for crop selection and planting date

## Backend API (tRPC Procedures)
- [x] Create sensor data procedures (get current, get history)
- [x] Create actuator control procedures (get status, toggle)
- [x] Implement rule-based decision engine
- [x] Create decision log procedures (get history, log action)
- [x] Create crop management procedures (list, select, set planting date)
- [x] Create system mode procedures (toggle AUTO/MANUAL)
- [x] Add vitest tests for decision engine logic

## Frontend UI - Core Screens
- [x] Implement cyberpunk theme with neon pink/cyan and glow effects
- [ ] Build login/authentication screen (optional)
- [x] Create main dashboard layout with mobile-first responsive design
- [x] Implement header with project name and cloud connection status
- [ ] Build crop card displaying name, scientific name, growth stage, days since planting
- [x] Create 2x2 sensor card grid (temperature, humidity, soil moisture, light)
- [x] Implement actuator status display (pump, fan, light)
- [x] Build system mode toggle (AUTO/MANUAL) with warning indicator
- [x] Create manual control section (visible only in MANUAL mode)
- [x] Implement decision log scrollable section (last 5-10 actions)
- [x] Build settings screen (crop selection, planting date, reset)

## Styling & Visual Effects
- [ ] Apply deep black background with neon glow effects
- [ ] Implement HUD-style corner brackets and technical lines
- [ ] Add status color indicators (normal/warning) to sensor cards
- [ ] Create animated glow effects for neon text
- [ ] Ensure high contrast for readability
- [ ] Test responsive design on mobile browsers

## Testing & Validation
- [ ] Test sensor data updates in real-time
- [ ] Verify rule-based automation decisions
- [ ] Test manual override functionality
- [ ] Validate decision log explanations
- [ ] Test crop selection and planting date configuration
- [ ] Verify mobile responsiveness on Android/Chrome

## Deployment & Documentation
- [ ] Create checkpoint for completed system
- [ ] Document API procedures and decision engine logic
- [ ] Prepare for academic defense presentation


## ESP32 Hardware Integration
- [ ] Design ESP32 wiring diagram (DHT22, soil moisture sensor, light sensor, relay modules)
- [ ] Create ESP32 firmware sketch for sensor reading and data transmission
- [ ] Implement MQTT or HTTP API endpoint for sensor data ingestion
- [ ] Add device registration and authentication for ESP32
- [ ] Create test harness for simulating ESP32 sensor data
- [ ] Document ESP32 setup and calibration procedures

## Advanced Analytics & Charts
- [ ] Add historical sensor data queries (hourly, daily, weekly aggregates)
- [ ] Create analytics page with Recharts visualizations
- [ ] Implement temperature trend chart (line chart with min/max/avg)
- [ ] Implement humidity trend chart
- [ ] Implement soil moisture trend chart
- [ ] Add light level trend chart
- [ ] Create decision frequency analysis chart
- [ ] Add date range picker for analytics filtering
- [ ] Implement anomaly detection alerts
- [ ] Create weekly/monthly summary statistics

## Multi-Greenhouse Support
- [ ] Extend database schema to support multiple greenhouses per user
- [ ] Create greenhouse selector/switcher UI component
- [ ] Implement greenhouse list and management page
- [ ] Add ability to create new greenhouses
- [ ] Add greenhouse naming and configuration
- [ ] Implement comparative analytics (compare multiple greenhouses)
- [ ] Add greenhouse-specific settings and preferences
- [ ] Create greenhouse deletion/archival functionality
- [ ] Add greenhouse sharing permissions (optional)
- [ ] Implement greenhouse dashboard switching


## ESP32 Hardware Integration (COMPLETED)
- [x] Design ESP32 wiring diagram (DHT22, soil moisture sensor, light sensor, relay modules)
- [x] Create ESP32 firmware sketch for sensor reading and data transmission
- [x] Implement MQTT or HTTP API endpoint for sensor data ingestion
- [x] Add device registration and authentication for ESP32
- [x] Create test harness for simulating ESP32 sensor data
- [x] Document ESP32 setup and calibration procedures

## Advanced Analytics & Charts (COMPLETED)
- [x] Add historical sensor data queries (hourly, daily, weekly aggregates)
- [x] Create analytics page with Recharts visualizations
- [x] Implement temperature trend chart (line chart with min/max/avg)
- [x] Implement humidity trend chart
- [x] Implement soil moisture trend chart
- [x] Add light level trend chart
- [x] Create decision frequency analysis chart
- [x] Add date range picker for analytics filtering (24h, 7d, 30d)
- [x] Create weekly/monthly summary statistics

## Multi-Greenhouse Support (IN PROGRESS)
- [x] Create greenhouses management page
- [x] Implement greenhouse selector/switcher UI component
- [x] Add ability to view multiple greenhouses
- [ ] Implement greenhouse creation via API
- [ ] Add greenhouse deletion/archival functionality
- [ ] Implement comparative analytics (compare multiple greenhouses)
- [ ] Add greenhouse-specific settings and preferences
- [ ] Add greenhouse sharing permissions (optional)

## Rwanda Crop Database Integration (COMPLETED)
- [x] Process Rwanda comprehensive crop CSV (30 crops)
- [x] Add all 30 Rwanda crops to database
- [x] Verify crop parameters and growth stages
- [x] Test decision engine with Rwanda crops
