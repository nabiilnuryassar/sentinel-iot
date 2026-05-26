<?php

namespace App\Models;

use Database\Factories\IncidentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Incident.
 *
 * `affected_device_id` is the string `devices.device_id` (Design D7).
 * `created_by` references `users.id` per the PRD §13.1 ERD's USERS creates
 * INCIDENTS edge.
 *
 * @property int $id
 * @property string $title
 * @property string $severity
 * @property string $status
 * @property ?string $affected_device_id
 * @property ?string $summary
 * @property ?string $root_cause
 * @property ?string $recommendation
 * @property ?int $created_by
 */
class Incident extends Model
{
    /** @use HasFactory<IncidentFactory> */
    use HasFactory;

    public const SEVERITY_LOW = 'low';

    public const SEVERITY_MEDIUM = 'medium';

    public const SEVERITY_HIGH = 'high';

    public const SEVERITY_CRITICAL = 'critical';

    public const STATUS_OPEN = 'open';

    public const STATUS_INVESTIGATING = 'investigating';

    public const STATUS_MITIGATED = 'mitigated';

    public const STATUS_CLOSED = 'closed';

    protected $guarded = [];

    /**
     * @return HasMany<IncidentReport, $this>
     */
    public function reports(): HasMany
    {
        return $this->hasMany(IncidentReport::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<Device, $this>
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'affected_device_id', 'device_id');
    }
}
