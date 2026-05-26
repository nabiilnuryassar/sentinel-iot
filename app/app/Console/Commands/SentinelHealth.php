<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\Incident;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * `php artisan sentinel:health` — quick pre-demo readiness check.
 *
 * Five rows, each green / yellow / red:
 *  1. Database — `DB::connection()->getPdo()` doesn't throw.
 *  2. MQTT broker — TCP CONNECT to `MQTT_HOST:MQTT_PORT` succeeds within 2 s.
 *  3. AI provider — at least one of OPENAI / ANTHROPIC / GEMINI keys is set.
 *  4. Devices last 5m — Device::where('last_seen_at', '>=', now()->subMinutes(5))->count() ≥ 1.
 *  5. Open incidents — informational count, never failing.
 *
 * Exit code 0 only if both DB and MQTT pass; otherwise 1. Yellow rows
 * (no AI key, no recent telemetry) keep the exit code at 0 — they're
 * advisory, not show-stoppers for the demo.
 */
class SentinelHealth extends Command
{
    protected $signature = 'sentinel:health';

    protected $description = 'Verify the demo prerequisites: database, MQTT broker, AI provider, recent telemetry, open incidents.';

    public function handle(): int
    {
        $rows = [];
        $hardFail = false;

        // 1. Database
        try {
            DB::connection()->getPdo();
            $driver = DB::connection()->getDriverName();
            $rows[] = $this->row('ok', 'Database', "connected ({$driver})");
        } catch (Throwable $e) {
            $rows[] = $this->row('fail', 'Database', 'connection failed: '.$e->getMessage());
            $hardFail = true;
        }

        // 2. MQTT broker — plain TCP probe is enough; we don't need to
        //    speak protocol to confirm the broker is reachable.
        $mqttHost = (string) (env('MQTT_HOST') ?: 'mosquitto');
        $mqttPort = (int) (env('MQTT_PORT') ?: 1883);
        if ($this->canConnect($mqttHost, $mqttPort, 2)) {
            $rows[] = $this->row('ok', 'MQTT broker', "reachable at {$mqttHost}:{$mqttPort}");
        } else {
            $rows[] = $this->row('fail', 'MQTT broker', "cannot reach {$mqttHost}:{$mqttPort}");
            $hardFail = true;
        }

        // 3. AI provider keys
        $providers = [
            'OPENAI_API_KEY' => 'OpenAI',
            'ANTHROPIC_API_KEY' => 'Anthropic',
            'GEMINI_API_KEY' => 'Gemini',
        ];
        $present = [];
        foreach ($providers as $envKey => $label) {
            if (! empty(env($envKey))) {
                $present[] = $label;
            }
        }
        if ($present !== []) {
            $rows[] = $this->row('ok', 'AI provider', implode(', ', $present).' key set');
        } else {
            $rows[] = $this->row('warn', 'AI provider', 'no key set (agent will use mock)');
        }

        // 4. Recent telemetry
        try {
            $online = Device::query()
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->count();
            if ($online >= 1) {
                $rows[] = $this->row('ok', 'Devices last 5m', "{$online} online");
            } else {
                $rows[] = $this->row('warn', 'Devices last 5m', 'no devices reporting in last 5 min');
            }
        } catch (Throwable $e) {
            $rows[] = $this->row('warn', 'Devices last 5m', 'query failed: '.$e->getMessage());
        }

        // 5. Open incidents — informational
        try {
            $open = Incident::query()
                ->where('status', Incident::STATUS_OPEN)
                ->count();
            $rows[] = $this->row('info', 'Open incidents', (string) $open);
        } catch (Throwable $e) {
            $rows[] = $this->row('info', 'Open incidents', 'unavailable');
        }

        foreach ($rows as $row) {
            $this->getOutput()->writeln($row);
        }

        return $hardFail ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Format one health-check row with a leading status glyph,
     * left-padded label, and the message.
     */
    protected function row(string $status, string $label, string $message): string
    {
        $glyph = match ($status) {
            'ok' => '<fg=green>✓</>',
            'fail' => '<fg=red>✗</>',
            'warn' => '<fg=yellow>⚠</>',
            'info' => '<fg=blue>ℹ</>',
            default => ' ',
        };

        $paddedLabel = str_pad($label, 22);

        return "{$glyph} {$paddedLabel}{$message}";
    }

    protected function canConnect(string $host, int $port, int $timeoutSeconds): bool
    {
        $errno = 0;
        $errstr = '';
        $handle = @fsockopen($host, $port, $errno, $errstr, $timeoutSeconds);
        if ($handle === false) {
            return false;
        }

        fclose($handle);

        return true;
    }
}
