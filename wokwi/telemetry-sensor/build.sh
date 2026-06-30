#!/bin/bash
set -e
echo "=== Building Wokwi firmware ==="

# Compile
mkdir -p .build
arduino-cli compile --fqbn esp32:esp32:esp32 --output-dir .build telemetry-sensor.ino

echo ""
echo "=== Build complete! ==="
echo "Files:"
ls -la .build/*.bin .build/*.elf 2>/dev/null
echo ""
echo "=== wokwi.toml ==="
cat wokwi.toml
echo ""
echo "Ready! Open this folder in VS Code → Play ▶️"
