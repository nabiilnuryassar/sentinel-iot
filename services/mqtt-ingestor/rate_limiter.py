"""Sliding-window rate limiter for the MQTT ingestor.

Pure Python, no I/O. Detects publish floods on a partition key (typically the
topic's device_id segment, see Phase 6 design note D7 / Option A).

Why partition by topic_device_id and not by source_client_id?
paho-mqtt v2's `on_message` does not surface the publishing client's broker
username — only the broker knows it. Partitioning by the topic device_id
segment is enough to detect "flood one device's topic", which is what the
demo's Scenario 3 exercises.

Design:
- Sliding window of length `window_seconds` per partition.
- Threshold violation: more than `threshold` events inside the window.
- After firing, suppress further events on that partition for
  `cooldown_seconds`. This caps reporting at one event per cooldown per
  partition no matter how aggressive the flood is.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque


class RateLimiter:
    """Per-partition sliding-window flood detector.

    `observe(partition_key, now=None)` returns True the moment a flood is
    detected for that partition. False otherwise. Side-effects: appends `now`
    to the window, evicts old entries, and stores the cooldown timestamp on
    detection.
    """

    def __init__(
        self,
        window_seconds: int = 10,
        threshold: int = 50,
        cooldown_seconds: int = 60,
    ) -> None:
        if window_seconds <= 0:
            raise ValueError("window_seconds must be > 0")
        if threshold <= 0:
            raise ValueError("threshold must be > 0")
        if cooldown_seconds < 0:
            raise ValueError("cooldown_seconds must be >= 0")

        self.window_seconds = window_seconds
        self.threshold = threshold
        self.cooldown_seconds = cooldown_seconds

        self._windows: dict[str, Deque[float]] = defaultdict(deque)
        self._last_event: dict[str, float] = {}

    def observe(self, partition_key: str, now: float | None = None) -> bool:
        """Record one event on `partition_key` and return whether to fire.

        Returns True iff the count inside the trailing `window_seconds` is
        strictly greater than `threshold` AND the partition is not in
        cooldown. Caller is responsible for the actual side-effect (e.g. DB
        write).
        """
        if now is None:
            now = time.monotonic()

        window = self._windows[partition_key]
        cutoff = now - self.window_seconds

        # Evict events that fell out of the trailing window.
        while window and window[0] < cutoff:
            window.popleft()

        window.append(now)

        if len(window) <= self.threshold:
            return False

        last = self._last_event.get(partition_key)
        if last is not None and (now - last) < self.cooldown_seconds:
            return False

        self._last_event[partition_key] = now
        return True

    def reset(self, partition_key: str | None = None) -> None:
        """Drop state. Useful for tests; not used in production."""
        if partition_key is None:
            self._windows.clear()
            self._last_event.clear()
            return
        self._windows.pop(partition_key, None)
        self._last_event.pop(partition_key, None)
