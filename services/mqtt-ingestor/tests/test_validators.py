"""Unit tests for the ingestor's pure validators.

No broker, no database — runs in milliseconds against the simulator's payload
shape (mirrors `simulator/device_profiles.json`).
"""

from __future__ import annotations

import pytest

import validators


def _valid_payload(**overrides):
    payload = {
        "device_id": "temp-sensor-001",
        "type": "temperature_sensor",
        "timestamp": "2026-05-15T18:00:00+00:00",
        "location": "lab-a",
        "temperature": 24.5,
        "humidity": 60,
        "battery": 92,
        "rssi": -60,
        "status": "normal",
    }
    payload.update(overrides)
    return payload


VALID_TOPIC = "iot/building-a/lab-a/temp-sensor-001/telemetry"


# ---------------------------------------------------------------------------
# parse_topic
# ---------------------------------------------------------------------------


def test_parse_topic_telemetry():
    assert validators.parse_topic(VALID_TOPIC) == (
        "building-a",
        "lab-a",
        "temp-sensor-001",
        "telemetry",
    )


def test_parse_topic_event():
    topic = "iot/building-a/lobby/door-lock-001/event"
    assert validators.parse_topic(topic) == (
        "building-a",
        "lobby",
        "door-lock-001",
        "event",
    )


def test_parse_topic_too_short():
    assert validators.parse_topic("iot/foo/bar") is None


def test_parse_topic_unknown_kind():
    assert (
        validators.parse_topic("iot/building-a/lab-a/temp-sensor-001/heartbeat")
        is None
    )


def test_parse_topic_non_string():
    assert validators.parse_topic(123) is None  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# validate_telemetry
# ---------------------------------------------------------------------------


def test_validate_telemetry_happy_path():
    ok, reason = validators.validate_telemetry(_valid_payload(), VALID_TOPIC)
    assert ok is True
    assert reason is None


@pytest.mark.parametrize(
    "missing_field",
    ["device_id", "type", "timestamp", "location"],
)
def test_validate_telemetry_missing_required_field(missing_field):
    payload = _valid_payload()
    payload.pop(missing_field)
    ok, reason = validators.validate_telemetry(payload, VALID_TOPIC)
    assert ok is False
    assert reason == f"missing_{missing_field}"


def test_validate_telemetry_device_spoofing():
    payload = _valid_payload(device_id="other-device")
    ok, reason = validators.validate_telemetry(payload, VALID_TOPIC)
    assert ok is False
    assert reason == "device_spoofing"


def test_validate_telemetry_invalid_topic():
    ok, reason = validators.validate_telemetry(_valid_payload(), "iot/foo/bar")
    assert ok is False
    assert reason == "invalid_topic"


def test_validate_telemetry_non_dict_payload():
    ok, reason = validators.validate_telemetry("not a dict", VALID_TOPIC)  # type: ignore[arg-type]
    assert ok is False
    assert reason == "invalid_payload"


# ---------------------------------------------------------------------------
# extract_typed_columns
# ---------------------------------------------------------------------------


def test_extract_typed_columns_full():
    out = validators.extract_typed_columns(_valid_payload())
    assert out == {
        "temperature": 24.5,
        "humidity": 60.0,
        "battery": 92.0,
        "rssi": -60.0,
    }


def test_extract_typed_columns_missing_returns_none():
    payload = {"device_id": "x", "type": "y", "timestamp": "z", "location": "w"}
    assert validators.extract_typed_columns(payload) == {
        "temperature": None,
        "humidity": None,
        "battery": None,
        "rssi": None,
    }


def test_extract_typed_columns_ignores_non_numeric():
    payload = {
        "temperature": "hot",
        "humidity": True,  # bool — explicitly ignored
        "battery": None,
        "rssi": -55,
    }
    assert validators.extract_typed_columns(payload) == {
        "temperature": None,
        "humidity": None,
        "battery": None,
        "rssi": -55.0,
    }
