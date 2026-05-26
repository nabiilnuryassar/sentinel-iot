"""Unit tests for the publish-flood RateLimiter.

No broker, no DB, no real time \u2014 we pass `now=...` explicitly into observe()
to drive the sliding window deterministically.
"""

from __future__ import annotations

import pytest

from rate_limiter import RateLimiter


# ---------------------------------------------------------------------------
# constructor validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "kwargs",
    [
        {"window_seconds": 0},
        {"window_seconds": -1},
        {"threshold": 0},
        {"threshold": -10},
        {"cooldown_seconds": -1},
    ],
)
def test_constructor_rejects_invalid_args(kwargs):
    base = {"window_seconds": 10, "threshold": 50, "cooldown_seconds": 60}
    base.update(kwargs)
    with pytest.raises(ValueError):
        RateLimiter(**base)


# ---------------------------------------------------------------------------
# threshold behaviour
# ---------------------------------------------------------------------------


def test_exactly_threshold_messages_does_not_trigger():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)
    fired = [limiter.observe("dev-1", now=0.0 + i * 0.1) for i in range(50)]
    assert not any(fired), "50 messages must not fire (threshold is exclusive)"


def test_threshold_plus_one_triggers():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)
    # 50 messages: silent.
    for i in range(50):
        assert limiter.observe("dev-1", now=0.0 + i * 0.05) is False
    # 51st within the window: fires.
    assert limiter.observe("dev-1", now=0.0 + 50 * 0.05) is True


# ---------------------------------------------------------------------------
# cooldown
# ---------------------------------------------------------------------------


def _flood_to_fire(limiter: RateLimiter, key: str, start: float) -> float:
    """Drive the limiter just past the threshold and return the firing timestamp."""
    for i in range(limiter.threshold):
        limiter.observe(key, now=start + i * 0.01)
    fire_time = start + limiter.threshold * 0.01
    assert limiter.observe(key, now=fire_time) is True
    return fire_time


def test_cooldown_suppresses_second_event_within_window():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)
    fire_time = _flood_to_fire(limiter, "dev-1", start=0.0)

    # Hammer with 1000 more messages, all inside the 60s cooldown.
    fired_again = False
    for i in range(1, 1001):
        if limiter.observe("dev-1", now=fire_time + i * 0.01):
            fired_again = True
            break
    assert fired_again is False, "cooldown must suppress further events"


def test_cooldown_expires_and_new_event_can_fire():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)
    fire_time = _flood_to_fire(limiter, "dev-1", start=0.0)

    # Jump past cooldown, well past the window so the deque is empty.
    later = fire_time + 120.0
    for i in range(50):
        assert limiter.observe("dev-1", now=later + i * 0.01) is False
    assert limiter.observe("dev-1", now=later + 50 * 0.01) is True


# ---------------------------------------------------------------------------
# partition isolation
# ---------------------------------------------------------------------------


def test_partitions_are_independent():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)

    # Partition A floods.
    for i in range(50):
        limiter.observe("dev-A", now=0.0 + i * 0.01)
    assert limiter.observe("dev-A", now=0.0 + 50 * 0.01) is True

    # Partition B at the same moment is unaffected and silent at 50.
    for i in range(50):
        assert limiter.observe("dev-B", now=0.0 + i * 0.01) is False


# ---------------------------------------------------------------------------
# eviction
# ---------------------------------------------------------------------------


def test_messages_outside_window_are_evicted():
    limiter = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)
    # 100 messages spread over 30 seconds \u2192 ~33 per 10s window.
    fired = [limiter.observe("dev-1", now=0.0 + i * 0.3) for i in range(100)]
    assert not any(fired), "spread-out load must not trigger flood"


def test_eviction_uses_strict_inequality():
    """An entry exactly at `now - window_seconds` should be evicted."""
    limiter = RateLimiter(window_seconds=10, threshold=2, cooldown_seconds=60)
    # Two old entries.
    limiter.observe("dev-1", now=0.0)
    limiter.observe("dev-1", now=1.0)
    # Two fresh entries 12s later \u2014 old ones must be gone, count = 2 (no fire).
    assert limiter.observe("dev-1", now=12.0) is False
    assert limiter.observe("dev-1", now=12.5) is False
    # Third fresh \u2014 fires.
    assert limiter.observe("dev-1", now=13.0) is True
