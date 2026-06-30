<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Health dashboard endpoint — DB + MQTT connectivity check.
 *
 * Public endpoint (no auth) for monitoring dashboards and uptime probes.
 * Returns 200 when all checks pass, 503 when any check fails.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [];

        // Database connectivity
        try {
            DB::select('SELECT 1');
            $checks['database'] = 'ok';
        } catch (\Throwable $e) {
            $checks['database'] = 'fail: '.$e->getMessage();
        }

        // MQTT broker (TCP probe)
        $mqttHost = (string) (env('MQTT_HOST') ?: 'mosquitto');
        $mqttPort = (int) (env('MQTT_PORT') ?: 1883);
        $handle = @fsockopen($mqttHost, $mqttPort, $errno, $errstr, 2);
        if ($handle !== false) {
            fclose($handle);
            $checks['mqtt'] = 'ok';
        } else {
            $checks['mqtt'] = "fail: {$errstr}";
        }

        $allOk = collect($checks)->every(fn (string $v): bool => $v === 'ok');

        return response()->json([
            'status' => $allOk ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => Carbon::now()->toIso8601String(),
        ], $allOk ? 200 : 503);
    }
}
