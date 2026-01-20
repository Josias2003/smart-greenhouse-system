# ESP32 Smart Greenhouse Wiring Guide

## Overview

This guide provides detailed wiring instructions for connecting sensors and actuators to the ESP32 microcontroller for the smart greenhouse system.

## Hardware Components

### Required Components
- **ESP32 Development Board** (30-pin or 36-pin variant)
- **DHT22 Temperature & Humidity Sensor** (digital)
- **Capacitive Soil Moisture Sensor** (analog)
- **Light Intensity Sensor / LDR with ADC** (analog)
- **3x Relay Modules** (for Pump, Fan, Light control)
- **Power Supply** (5V, 2A minimum)
- **Jumper Wires** (male-to-male and male-to-female)
- **Breadboard** (optional, for prototyping)

### Optional Components
- **DS18B20** (alternative temperature sensor)
- **Capacitor** (0.1µF for DHT22 stabilization)
- **Pull-up Resistor** (4.7kΩ for DHT22 data line)

## Pin Configuration

```
ESP32 GPIO Mapping:
┌─────────────────────────────────────────────────┐
│ ESP32 DevKit Pin Configuration                  │
├─────────────────────────────────────────────────┤
│ GPIO 4  → DHT22 Data (Temperature/Humidity)     │
│ GPIO 12 → Pump Relay Signal (Active HIGH)       │
│ GPIO 13 → Fan Relay Signal (Active HIGH)        │
│ GPIO 14 → Light Relay Signal (Active HIGH)      │
│ GPIO 34 → Soil Moisture Sensor (ADC1_CH6)       │
│ GPIO 35 → Light Sensor (ADC1_CH7)               │
│ GND     → Common Ground (all sensors)            │
│ 5V/3V3  → Power Supply (sensor dependent)        │
└─────────────────────────────────────────────────┘
```

## Detailed Wiring Connections

### 1. DHT22 Temperature & Humidity Sensor

**Pin Configuration:**
- Pin 1 (VCC) → ESP32 3.3V
- Pin 2 (Data) → ESP32 GPIO 4
- Pin 3 (NC) → Not Connected
- Pin 4 (GND) → ESP32 GND

**Wiring Diagram:**
```
DHT22
├─ VCC (1) ──────────────┬─ 3.3V
├─ Data (2) ─────[4.7kΩ]─┼─ GPIO 4
├─ NC (3)
└─ GND (4) ──────────────┴─ GND
```

**Notes:**
- Add 0.1µF capacitor between VCC and GND for noise filtering
- 4.7kΩ pull-up resistor on data line (optional but recommended)
- Keep wires short (< 20cm) to minimize noise
- Allow 2 seconds between successive reads

### 2. Capacitive Soil Moisture Sensor

**Pin Configuration:**
- VCC → ESP32 5V (or 3.3V with level shifter)
- GND → ESP32 GND
- AO (Analog Out) → ESP32 GPIO 34 (ADC1_CH6)

**Wiring Diagram:**
```
Soil Moisture Sensor
├─ VCC ──────────────── 5V
├─ GND ──────────────── GND
└─ AO ───────────────── GPIO 34 (ADC)
```

**Calibration:**
1. Dry soil reading: ~3500-4095 ADC
2. Saturated soil reading: ~500-1000 ADC
3. Use `map()` function: `map(reading, 500, 4095, 100, 0)` for 0-100% conversion

**Notes:**
- Sensor is capacitive (non-invasive)
- Avoid direct water contact with electronics
- Encapsulate sensor in waterproof housing
- Calibrate for your specific soil type

### 3. Light Intensity Sensor (LDR + ADC)

**Pin Configuration:**
- VCC → ESP32 5V
- GND → ESP32 GND
- AO (Analog Out) → ESP32 GPIO 35 (ADC1_CH7)

**Wiring Diagram (LDR with voltage divider):**
```
        5V
        │
       [R1] (10kΩ resistor)
        │
        ├─────────────── GPIO 35 (ADC)
        │
       [LDR]
        │
       GND
```

**Calibration:**
1. Darkness: ~0-500 ADC
2. Indoor light: ~1000-2000 ADC
3. Bright sunlight: ~3500-4095 ADC
4. Convert to lux: `map(reading, 0, 4095, 0, 10000)` (approximate)

**Notes:**
- LDR resistance varies with light intensity
- Use quality resistor for consistent readings
- Shield from direct heat sources

### 4. Relay Modules (Pump, Fan, Light)

**Relay Module Pin Configuration (typical 5V relay):**
- VCC → ESP32 5V
- GND → ESP32 GND
- IN1 (Signal) → ESP32 GPIO 12 (Pump)
- IN2 (Signal) → ESP32 GPIO 13 (Fan)
- IN3 (Signal) → ESP32 GPIO 14 (Light)

**Relay Output Connections:**
```
Relay Module (3-channel)
├─ VCC ──────────────── 5V
├─ GND ──────────────── GND
├─ IN1 ──────────────── GPIO 12
├─ IN2 ──────────────── GPIO 13
├─ IN3 ──────────────── GPIO 14
│
└─ Relay Outputs:
   ├─ COM1 ──┬─ NC1 (Normally Closed)
   │         └─ NO1 (Normally Open) → Pump Power
   ├─ COM2 ──┬─ NC2
   │         └─ NO2 → Fan Power
   └─ COM3 ──┬─ NC3
             └─ NO3 → Light Power
```

**Wiring Diagram (Pump Example):**
```
AC/DC Power Supply (12V or 24V)
├─ Positive ──────────┬─ Pump Motor
│                     │
│                 Relay NO1 ─── COM1 ─── Negative
│
└─ Negative ─────────────────────────────┘
```

**Notes:**
- Use normally open (NO) contacts for safety
- Add flyback diode across relay coil (1N4007)
- Keep high-voltage wiring separate from signal wires
- Use appropriate gauge wire for current load

## Complete System Wiring Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ESP32 DevKit                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  3.3V ──┬─ DHT22 VCC                                   │
│         │                                              │
│  GPIO 4 ├─ DHT22 Data ──┐                             │
│         │               │                              │
│  GND ───┼─ DHT22 GND    │                             │
│         │               │                              │
│  GPIO 34├─ Soil Moisture ADC                          │
│         │                                              │
│  GPIO 35├─ Light Sensor ADC                           │
│         │                                              │
│  GPIO 12├─ Relay IN1 (Pump)                           │
│         │                                              │
│  GPIO 13├─ Relay IN2 (Fan)                            │
│         │                                              │
│  GPIO 14├─ Relay IN3 (Light)                          │
│         │                                              │
│  5V ────┼─ Relay Module VCC                           │
│         │                                              │
│  GND ───┴─ Common Ground (all sensors & relays)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Power Supply Considerations

### Voltage Requirements
- **ESP32**: 5V (USB) or 3.3V (internal regulator)
- **DHT22**: 3.3V - 5.5V (use 3.3V for safety)
- **Soil Moisture Sensor**: 3.3V - 5V
- **Light Sensor**: 5V (with voltage divider)
- **Relay Module**: 5V
- **Actuators**: Depends on motor/pump specifications

### Power Budget
```
Component              Current (typical)
─────────────────────────────────────
ESP32                  ~80mA (active)
DHT22                  ~2.5mA
Soil Moisture Sensor   ~5mA
Light Sensor           ~1mA
Relay Module (idle)    ~15mA
Relay Module (active)  ~70mA per relay
─────────────────────────────────────
Total (all active)     ~250mA
```

**Recommendation:** Use 5V/2A power supply for stable operation

## Assembly Steps

1. **Prepare the breadboard** (if using)
   - Place ESP32 in center
   - Connect power rails (5V and GND)

2. **Connect DHT22**
   - VCC to 3.3V
   - Data to GPIO 4 (with optional pull-up)
   - GND to common ground

3. **Connect Soil Moisture Sensor**
   - VCC to 5V
   - AO to GPIO 34
   - GND to common ground

4. **Connect Light Sensor**
   - VCC to 5V
   - AO to GPIO 35
   - GND to common ground

5. **Connect Relay Module**
   - VCC to 5V
   - GND to common ground
   - IN1, IN2, IN3 to GPIO 12, 13, 14

6. **Connect Actuators to Relay Outputs**
   - Pump to Relay 1 (NO contact)
   - Fan to Relay 2 (NO contact)
   - Light to Relay 3 (NO contact)

7. **Power up and test**
   - Verify all sensors read values
   - Test relay switching
   - Monitor serial output

## Testing Checklist

- [ ] ESP32 boots successfully
- [ ] WiFi connects to network
- [ ] DHT22 reads temperature and humidity
- [ ] Soil moisture sensor returns ADC values
- [ ] Light sensor returns ADC values
- [ ] Relay 1 (Pump) switches on/off
- [ ] Relay 2 (Fan) switches on/off
- [ ] Relay 3 (Light) switches on/off
- [ ] Data transmits to cloud backend
- [ ] Cloud commands control relays

## Troubleshooting

### DHT22 Not Reading
- Check data line connection and pull-up resistor
- Verify 3.3V power supply
- Try different GPIO pin
- Add 0.1µF capacitor for noise filtering

### Soil Moisture Sensor ADC Always 0 or 4095
- Check ADC pin connection
- Verify sensor power supply
- Test with known voltage (1.65V = ~2048 ADC)
- Calibrate ADC reference

### Relay Not Switching
- Verify GPIO pin connection
- Check relay module power supply
- Test relay with multimeter
- Verify relay signal polarity

### WiFi Connection Issues
- Check SSID and password
- Verify WiFi signal strength
- Check firewall settings
- Restart ESP32 and router

## Safety Considerations

⚠️ **High Voltage Warning:**
- Keep high-voltage wiring away from low-voltage signals
- Use proper insulation and shielding
- Never touch relay contacts during operation
- Use appropriate breakers and fuses

⚠️ **Moisture Protection:**
- Encapsulate all electronics in waterproof housing
- Use silicone sealant for sensor connections
- Avoid direct water spray on circuit board
- Provide adequate ventilation

## References

- [ESP32 Pinout Documentation](https://github.com/espressif/esp-idf)
- [DHT22 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)
- [Arduino DHT Library](https://github.com/adafruit/DHT-sensor-library)
- [Arduino JSON Library](https://github.com/bblanchon/ArduinoJson)
