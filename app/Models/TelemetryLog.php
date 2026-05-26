<?php

namespace App\Models;

use Database\Factories\TelemetryLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * TelemetryLog.
 *
 * Joined back to {@see Device} via the string `device_id` natural key
 * (Design D7), not the bigint surrogate.
 *
 * @property int $id
 * @property string $device_id
 * @property string $topic
 * @property array<string, mixed> $payload_json
 * @property ?float $temperature
 * @property ?float $humidity
 * @property ?float $battery
 * @property ?float $rssi
 * @property Carbon $received_at
 */
class TelemetryLog extends Model
{
    /** @use HasFactory<TelemetryLogFactory> */
    use HasFactory;

    /**
     * Telemetry rows are inserted by the Python ingestor. We disable
     * Eloquent's `updated_at` upkeep because the table has only `created_at`.
     */
    public const UPDATED_AT = null;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'temperature' => 'float',
            'humidity' => 'float',
            'battery' => 'float',
            'rssi' => 'float',
            'received_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Device, $this>
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'device_id', 'device_id');
    }
}
