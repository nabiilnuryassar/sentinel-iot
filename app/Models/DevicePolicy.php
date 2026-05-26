<?php

namespace App\Models;

use Database\Factories\DevicePolicyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DevicePolicy.
 *
 * Encodes the publish/subscribe ACL the AI Agent's `audit_mqtt_broker` tool
 * compares against live `security_events` (Phase 4, P4.3). `device_id` is a
 * soft string FK to `devices.device_id` so policies can reference yet-to-be
 * provisioned devices without breaking the audit pipeline.
 *
 * @property int $id
 * @property string $device_id
 * @property string $allowed_client_id
 * @property string $allowed_topic
 * @property bool $can_publish
 * @property bool $can_subscribe
 * @property bool $is_active
 */
class DevicePolicy extends Model
{
    /** @use HasFactory<DevicePolicyFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'can_publish' => 'boolean',
            'can_subscribe' => 'boolean',
            'is_active' => 'boolean',
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
