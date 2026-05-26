#!/bin/bash
echo "Waiting for Docker to be ready..."
while true; do
  if docker ps >/dev/null 2>&1; then
    echo "Docker is up! Starting simulator..."
    
    # Ensure the main stack is running just in case the restart killed it
    docker compose up -d mosquitto postgres redis laravel.test
    
    # Run the simulator
    docker run --rm -d --name sim-bg --network sentinel-iot_default \
      -v "$PWD/simulator:/app" -w /app \
      -e MQTT_HOST=mosquitto -e MQTT_PORT=1883 \
      -e MQTT_USERNAME=sentinel_device -e MQTT_PASSWORD=sentinel_mqtt_password \
      python:3.12-slim sh -c "pip install --quiet -r requirements.txt && python virtual_devices.py --interval 3"
      
    echo "Simulator started successfully."
    break
  fi
  sleep 10
done
