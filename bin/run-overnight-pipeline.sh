#!/usr/bin/env bash
# Phase-by-phase autonomous pipeline runner for Sentinel-IoT UI overhaul.
#
# Each phase is one bounded pi --print call. Idempotent — phases reference
# SPEC.md + plan.md (created in Phase A) for context, so each pi call is fresh
# but well-informed.
#
# Failure handling: retry each phase up to 3 times. If a phase fails 3x,
# log and continue to next phase. Final report in HEARTBEAT.md.

set -uo pipefail

PROJECT="/mnt/c/Users/HYPE AMD/Documents/Mahasiswa/Semester 4/Project 2/sentinel-iot"
RUN_DIR="$PROJECT/.hermes-runs"
mkdir -p "$RUN_DIR"
TS="$(date +%Y%m%dT%H%M%S)"
RUN_LOG="$RUN_DIR/pipeline-$TS.log"
HEARTBEAT="$PROJECT/HEARTBEAT.md"

cd "$PROJECT"

# (Re-)init heartbeat
cat > "$HEARTBEAT" <<EOF
# Sentinel-IoT — Autonomous overnight run

Started: $(date '+%Y-%m-%d %H:%M:%S %Z')
Run log: .hermes-runs/pipeline-$TS.log
SPEC: SPEC.md

## Phase log

EOF

log() {
    local msg="$1"
    echo "[$(date '+%H:%M:%S')] $msg" | tee -a "$RUN_LOG"
}

heartbeat() {
    local line="$1"
    echo "[$(date '+%Y-%m-%d %H:%M')] $line" >> "$HEARTBEAT"
}

# Run pi --print, retry up to 3 times.
# Args: phase_id, prompt
# Output goes to RUN_LOG and a phase-specific file.
run_phase() {
    local phase_id="$1"
    local prompt="$2"
    local phase_log="$RUN_DIR/phase-$phase_id-$TS.log"

    log "=== Phase $phase_id START ==="
    heartbeat "phase=$phase_id status=start"

    for attempt in 1 2 3; do
        log "Phase $phase_id attempt $attempt"
        # pi --print --no-session forces fresh context, no resume.
        # --thinking high for better quality on design/code work.
        cmd.exe /c "pi --print --no-session --thinking high \"$prompt\"" \
            > "$phase_log" 2>&1
        local rc=$?
        if [[ $rc -eq 0 ]]; then
            local last_line=$(tail -1 "$phase_log" | tr -d '\r' | head -c 200)
            log "Phase $phase_id OK (attempt $attempt). Tail: $last_line"
            heartbeat "phase=$phase_id status=done attempt=$attempt note=\"$(echo "$last_line" | cut -c1-100)\""
            return 0
        fi
        log "Phase $phase_id FAIL attempt $attempt (rc=$rc)"
        sleep 5
    done

    log "Phase $phase_id GIVE UP after 3 attempts"
    heartbeat "phase=$phase_id status=FAILED note=\"3 attempts exhausted, see $phase_log\""
    return 1
}

# Run a verification command. Returns rc.
verify() {
    local label="$1"
    local cmd="$2"
    log "Verify: $label"
    if eval "$cmd" >> "$RUN_LOG" 2>&1; then
        log "Verify $label PASS"
        return 0
    else
        log "Verify $label FAIL"
        return 1
    fi
}

# ---------------------------------------------------------------------------
# Phase A — clarify SPEC + write plan.md
# ---------------------------------------------------------------------------
PROMPT_A='Read SPEC.md in the current working directory in full. It is the canonical brief for an overnight autonomous Sentinel-IoT UI overhaul.

Your task in this single call:
1. Read SPEC.md.
2. Read AGENTS.md (project guidelines).
3. Read package.json and composer.json to confirm stack.
4. Read resources/css/app.css to memorize the design tokens (--sentinel-* palette).
5. List resources/js/pages/ and resources/js/components/ to remember what already exists.
6. Read design-system/sentinel-iot/MASTER.md for design rules.
7. Write a detailed implementation plan to plan.md at the project root, organized by the phases described in SPEC.md §6 (P1..P8). For each phase include:
   - Files to create/modify (full paths)
   - Concrete tasks (checkbox list)
   - Verification step (command to run)
   - Estimated risk (low/med/high) and a fallback if risky.
8. Append your last status as the final heartbeat to HEARTBEAT.md:
   `[YYYY-MM-DD HH:MM] phase=A status=done note=\"plan.md written, N tasks across P1..P8\"`

DO NOT modify any source files yet. Only write plan.md and the heartbeat line.

Constraints:
- The user is asleep. Make decisions yourself.
- Docker is OFF on the host — Pest tests CANNOT run. Mark backend test steps as needs-docker.
- Frontend (vite/tsc/eslint) MUST be verifiable.

Start now.'

run_phase A "$PROMPT_A" || log "Phase A failed but continuing."

# Verify plan.md exists
if [[ ! -f "$PROJECT/plan.md" ]]; then
    log "plan.md NOT created. Falling back to inline phase prompts."
    heartbeat "phase=A status=PARTIAL note=\"plan.md not created\""
fi

# ---------------------------------------------------------------------------
# Phase B — welcome page (cyberpunk IoT landing)
# ---------------------------------------------------------------------------
PROMPT_B='Re-read SPEC.md §3.A (welcome page) and plan.md if it exists. Read design-system/sentinel-iot/MASTER.md.

Task: Replace resources/js/pages/welcome.tsx entirely with a cyberpunk-IoT-SOC landing page.

Required sections (from SPEC):
- Hero: glowing tagline, animated grid bg (use sentinel-grid-bg class from app.css), animated stat counters (devices monitored, threats blocked, uptime).
- Live stats preview row.
- Feature bento (4-6 cards): anomaly detect, MQTT broker audit, AI agent chat, telemetry dashboard, incident response, device management. Use lucide-react icons.
- Tech stack badges.
- CTA section -> /login.

Style:
- Dark OLED bg (var(--sentinel-bg-primary) #050b16). Neon accents (cyan #1fe6d0, teal, purple).
- Geist Sans for body, monospace for numeric tickers.
- Subtle text-shadow glow on headlines.
- Tailwind utility classes only. Reuse existing shadcn ui components (Card, Button, Badge).
- Responsive: 375 / 768 / 1024 / 1440 breakpoints. Touch targets >= 44px on mobile.
- Accessibility: focus rings, aria-labels for icon-only links, prefers-reduced-motion.

After writing the file:
1. Run `npm run types:check` — must exit 0.
2. Run `npm run build` — must exit 0.
3. Run `npm run lint -- resources/js/pages/welcome.tsx` to auto-fix lint.

If any check fails, fix and re-run. Loop until clean.

Append heartbeat: `[ts] phase=B status=done note=\"welcome.tsx replaced, types+build+lint green\"`

DO NOT touch any other file.'

run_phase B "$PROMPT_B"

# ---------------------------------------------------------------------------
# Phase C — agent chat realtime (SSE streaming)
# ---------------------------------------------------------------------------
PROMPT_C='Re-read SPEC.md §3.C (agent realtime chat) and plan.md.

Task: Refactor resources/js/pages/agent/index.tsx and the backend so the agent chat feels like ChatGPT/Claude — token streaming, typing indicator, optimistic user message, scroll-to-bottom, copy/regenerate.

Approach (preferred, avoid Reverb if possible):
- Backend: add `POST /agent/stream` route returning a streamed (chunked) JSON-lines or text/event-stream response. Reuse SentinelAgent::stream() (already exists in app/Ai/Agents/SentinelAgent.php). Symfony StreamedResponse is fine.
- Frontend: use fetch + ReadableStream (no axios). Show typing dots while waiting, append tokens as they arrive. Persist final message via existing AgentMessage flow.
- Add an internal Laravel event AgentMessageCompleted dispatched from the streaming endpoint when a run finishes. Plumb only — no external webhook listener required, but provide a stub listener documenting where to add it.

Backend tests cannot run (Docker off). Frontend MUST verify clean:
- `npm run types:check`
- `npm run build`
- `npm run lint`

Constraints:
- Reuse existing components (Card, Button, Textarea, ScrollArea, MarkdownView).
- Keep responsive across mobile.
- DO NOT delete agent_messages table or rename existing routes.
- Mark backend test gaps in HEARTBEAT.md as `needs-test-when-docker-up`.

Append heartbeat after success.'

run_phase C "$PROMPT_C"

# ---------------------------------------------------------------------------
# Phase D — dashboard restyle
# ---------------------------------------------------------------------------
PROMPT_D='Re-read SPEC.md §3.B and plan.md. Read resources/js/pages/dashboard.tsx.

Task: Restyle dashboard with cyberpunk neon theme. Keep all existing data flow and Inertia props — only restyle and improve animation/visual hierarchy.

Specifics:
- Hero stat row: animated counters with glow.
- Telemetry chart: neon stroke + grid bg.
- Risk pill: data-table look, mono font.
- Device + incident tables: glow on row hover, severity badges with pulse for critical.
- Empty / loading / error states: Skeleton + Toast.
- Responsive across mobile.

Verify: types, build, lint clean.
Append heartbeat.'

run_phase D "$PROMPT_D"

# ---------------------------------------------------------------------------
# Phase E — other module pages restyle
# ---------------------------------------------------------------------------
PROMPT_E='Re-read SPEC.md §3.D and plan.md.

Task: Restyle these pages in the same cyberpunk theme. Keep all data flow, Inertia props, route helpers untouched. Restyle only.

Pages:
- resources/js/pages/devices/index.tsx
- resources/js/pages/devices/show.tsx
- resources/js/pages/telemetry/index.tsx
- resources/js/pages/security-events/index.tsx
- resources/js/pages/incidents/index.tsx
- resources/js/pages/incidents/show.tsx

Standardize: PageHeader, StatCard row, primary table with mono columns, consistent empty/loading/error.

Verify: types, build, lint clean per page edited.
Append heartbeat per page completed.'

run_phase E "$PROMPT_E"

# ---------------------------------------------------------------------------
# Phase F — login page
# ---------------------------------------------------------------------------
PROMPT_F='Re-read SPEC.md §3.E.

Task: Restyle resources/js/pages/auth/login.tsx as a hacker-terminal sign-in. Keep existing form fields and Wayfinder action endpoints. Match cyberpunk theme.

Verify: types, build, lint clean.
Append heartbeat.'

run_phase F "$PROMPT_F"

# ---------------------------------------------------------------------------
# Phase G — final verification
# ---------------------------------------------------------------------------
log "=== Phase G: full verification ==="
verify "types:check" "npm run types:check"
TS_RC=$?
verify "build" "npm run build"
BUILD_RC=$?
verify "lint:check" "npm run lint:check"
LINT_RC=$?

heartbeat "phase=G status=done note=\"types:rc=$TS_RC build:rc=$BUILD_RC lint:rc=$LINT_RC\""

# ---------------------------------------------------------------------------
# Phase H — docs update
# ---------------------------------------------------------------------------
PROMPT_H='Update project documentation:

1. README.md — add a "UI Overview" section describing the new cyberpunk theme, list of pages, screenshots placeholder.
2. docs/ARCHITECTURE.md — add a "Realtime layer" subsection describing the SSE streaming endpoint added in Phase C.
3. docs/UI_GUIDE.md (NEW file) — summarize the design system (colors, typography, components, do/dont). Reference design-system/sentinel-iot/MASTER.md.
4. AGENTS.md — note that the ui-ux-pro-max skill should be used for any new UI work.

Keep changes scoped to docs only. No code edits.

Append heartbeat: `[ts] phase=H status=done note=\"README, ARCHITECTURE, UI_GUIDE, AGENTS updated\"`'

run_phase H "$PROMPT_H"

# ---------------------------------------------------------------------------
# Final summary
# ---------------------------------------------------------------------------
log "=== PIPELINE END ==="
heartbeat "PIPELINE COMPLETE"
heartbeat "Final verification: types:rc=$TS_RC build:rc=$BUILD_RC lint:rc=$LINT_RC"

if [[ $TS_RC -eq 0 && $BUILD_RC -eq 0 ]]; then
    heartbeat "Result: SUCCESS — types + build green"
    exit 0
else
    heartbeat "Result: PARTIAL — see logs in $RUN_DIR"
    exit 1
fi
