<?php

namespace App\Models;

use Database\Factories\DeviceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Device.
 *
 * Primary key is the bigint `id`, but the string `device_id` is the natural
 * key used for relationships (PRD §13.1 ERD; Design D7) — telemetry and
 * security events join on the string column, not the bigint surrogate.
 *
 * @property int $id
 * @property string $device_id
 * @property string $name
 * @property string $type
 * @property ?string $location
 * @property string $status
 * @property ?Carbon $last_seen_at
 * @property ?array<string, mixed> $metadata_json
 */
class Device extends Model
{
    /** @use HasFactory<DeviceFactory> */
    use HasFactory;

    public const STATUS_ONLINE = 'online';

    public const STATUS_OFFLINE = 'offline';

    public const STATUS_UNKNOWN = 'unknown';

    public const TYPE_TEMPERATURE_SENSOR = 'temperature_sensor';

    public const TYPE_DOOR_LOCK = 'door_lock';

    public const TYPE_POWER_METER = 'power_meter';

    public const TYPE_AIR_QUALITY = 'air_quality';

    public const TYPE_WATER_LEAK = 'water_leak';

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'metadata_json' => 'array',
        ];
    }

    /**
     * @return HasMany<TelemetryLog, $this>
     */
    public function telemetryLogs(): HasMany
    {
        return $this->hasMany(TelemetryLog::class, 'device_id', 'device_id');
    }

    /**
     * Soft string FK — see Design D7. `source_client_id` may not match a
     * known device for spoofing or attacker-client events.
     *
     * @return HasMany<SecurityEvent, $this>
     */
    public function securityEvents(): HasMany
    {
        return $this->hasMany(SecurityEvent::class, 'source_client_id', 'device_id');
    }

    /**
     * @return HasMany<DevicePolicy, $this>
     */
    public function policies(): HasMany
    {
        return $this->hasMany(DevicePolicy::class, 'device_id', 'device_id');
    }

    /**
     * @return HasMany<Incident, $this>
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'affected_device_id', 'device_id');
    }
}
