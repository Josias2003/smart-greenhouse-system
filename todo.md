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
