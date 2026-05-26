# FN-009

Phase 6 of Sentinel-IoT: Attack Simulator + ingestor rate limiter.

Tasks P6.1–P6.8:
- services/attack-simulator/{unauthorized_publish,malformed_payload,spoof_device,publish_flood}.py
- Update mqtt-ingestor with per-source_client_id rate window: >50 msgs in 10s -> publish_flood event (severity=high), 1 event/min/client cap.
- Unit test for rate limiter logic.
- README mapping each script to PRD demo scenarios.

Plan reference: thoughts/shared/plans/sentinel-iot-plan.md Phase 6.
