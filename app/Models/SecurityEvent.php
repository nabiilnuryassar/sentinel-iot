<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Database\Factories\SecurityEventFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * SecurityEvent.
 *
 * `source_client_id` is a soft string FK to `devices.device_id` (Design D7).
 * Events for unknown or spoofed clients still land in this table; the
 * relationship may resolve to null.
 *
 * @property int $id
 * @property string $event_type
 * @property string $severity
 * @property ?string $source_client_id
 * @property ?string $topic
 * @property ?array<string, mixed> $payload_json
 * @property ?string $description
 * @property Carbon $detected_at
 */
class SecurityEvent extends Model
{
    /** @use HasFactory<SecurityEventFactory> */
    use BelongsToTenant, HasFactory;

    public const UPDATED_AT = null;

    public const SEVERITY_LOW = 'low';

    public const SEVERITY_MEDIUM = 'medium';

    public const SEVERITY_HIGH = 'high';

    public const SEVERITY_CRITICAL = 'critical';

    public const TYPE_MALFORMED_PAYLOAD = 'malformed_payload';

    public const TYPE_DEVICE_SPOOFING = 'device_spoofing';

    public const TYPE_UNAUTHORIZED_PUBLISH = 'unauthorized_publish';

    public const TYPE_PUBLISH_FLOOD = 'publish_flood';

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'detected_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Device, $this>
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'source_client_id', 'device_id');
    }
}
