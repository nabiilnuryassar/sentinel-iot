<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ServiceHealthChecker
{
    /**
     * Ping each infrastructure service and return structured status. Each
     * check is isolated in try/catch so a single unreachable service degrades
     * to status 'error' instead of crashing the dashboard.
     *
     * @return array<int, array{name: string, version: string, status: string, icon: string}>
     */
    public function check(): array
    {
        return [
            $this->checkLaravel(),
            $this->checkPostgres(),
            $this->checkMqtt(),
            $this->checkAgent(),
            $this->checkTelegram(),
            $this->checkInfluxDb(),
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkLaravel(): array
    {
        return [
            'name' => 'Laravel App',
            'version' => 'v'.app()->version(),
            'status' => 'healthy',
            'icon' => 'Server',
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkPostgres(): array
    {
        $status = 'error';
        $version = 'unknown';

        try {
            $raw = (string) (DB::selectOne('SELECT version() as version')->version ?? '');
            $version = preg_match('/PostgreSQL\s+([\d.]+)/', $raw, $matches) ? 'v'.$matches[1] : 'connected';
            $status = 'healthy';
        } catch (\Throwable) {
            // connection failed — leave status 'error'
        }

        return [
            'name' => 'PostgreSQL',
            'version' => $version,
            'status' => $status,
            'icon' => 'HardDrive',
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkMqtt(): array
    {
        $host = (string) config('services.mqtt.host', '127.0.0.1');
        $port = (int) config('services.mqtt.port', 1883);
        $status = 'error';

        $socket = @fsockopen($host, $port, $errno, $errstr, 2);
        if ($socket !== false) {
            $status = 'healthy';
            fclose($socket);
        }

        return [
            'name' => 'Mosquitto MQTT Broker',
            'version' => (string) config('services.mqtt.version', 'v2.0.18'),
            'status' => $status,
            'icon' => 'RadioTower',
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkAgent(): array
    {
        $url = rtrim((string) config('services.agent.url', 'http://localhost:8001'), '/');
        $version = (string) config('services.agent.version', 'v1.8.3');
        $status = 'error';

        try {
            $response = Http::connectTimeout(2)->timeout(2)->get($url.'/health');
            if ($response->successful()) {
                $status = 'online';
                $version = (string) ($response->json('version') ?? $version);
            }
        } catch (\Throwable) {
            // unreachable — leave status 'error'
        }

        return [
            'name' => 'AI Agent Service',
            'version' => $version,
            'status' => $status,
            'icon' => 'Bot',
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkTelegram(): array
    {
        $token = (string) config('services.telegram.bot_token', '');
        $status = 'unknown';

        if ($token !== '') {
            $status = 'error';
            try {
                $response = Http::connectTimeout(2)->timeout(2)->get("https://api.telegram.org/bot{$token}/getMe");
                if ($response->successful() && $response->json('ok') === true) {
                    $status = 'connected';
                }
            } catch (\Throwable) {
                // unreachable — leave status 'error'
            }
        }

        return [
            'name' => 'Telegram Bot Gateway',
            'version' => (string) config('services.telegram.version', 'v1.6.2'),
            'status' => $status,
            'icon' => 'Send',
        ];
    }

    /** @return array{name: string, version: string, status: string, icon: string} */
    private function checkInfluxDb(): array
    {
        $url = rtrim((string) config('services.influxdb.url', 'http://localhost:8086'), '/');
        $status = 'error';

        try {
            $response = Http::connectTimeout(2)->timeout(2)->get($url.'/ping');
            if ($response->successful()) {
                $status = 'healthy';
            }
        } catch (\Throwable) {
            // unreachable — leave status 'error'
        }

        return [
            'name' => 'InfluxDB',
            'version' => (string) config('services.influxdb.version', 'v2.7.5'),
            'status' => $status,
            'icon' => 'Database',
        ];
    }
}
