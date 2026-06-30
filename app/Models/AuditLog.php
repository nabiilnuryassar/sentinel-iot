<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Audit log entry for admin actions (quarantine, incident close, token rotate, etc.).
 *
 * @property int $id
 * @property ?int $user_id
 * @property string $action
 * @property ?string $resource_type
 * @property ?int $resource_id
 * @property ?array<string, mixed> $before
 * @property ?array<string, mixed> $after
 * @property ?string $ip_address
 * @property ?string $user_agent
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class AuditLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'before' => 'array',
            'after' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
