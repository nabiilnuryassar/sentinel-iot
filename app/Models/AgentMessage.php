<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Database\Factories\AgentMessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * AgentMessage.
 *
 * Records every prompt/response pair routed through the AI Agent — both the
 * web console and the Telegram bot persist here (PRD §12.5, §12.6).
 * `metadata_json` carries optional tool-call traces from the FastAPI service.
 *
 * @property int $id
 * @property ?int $user_id
 * @property string $source
 * @property string $prompt
 * @property ?string $response
 * @property ?array<string, mixed> $metadata_json
 * @property ?Carbon $created_at
 */
class AgentMessage extends Model
{
    /** @use HasFactory<AgentMessageFactory> */
    use BelongsToTenant, HasFactory;

    public const UPDATED_AT = null;

    public const SOURCE_WEB = 'web';

    public const SOURCE_TELEGRAM = 'telegram';

    public const SOURCE_SYSTEM = 'system';

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata_json' => 'array',
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
