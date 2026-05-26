<?php

namespace App\Models;

use Database\Factories\IncidentReportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * IncidentReport.
 *
 * `report_markdown` is rendered by the Inertia incident view via the shared
 * `<MarkdownView>` component (Phase 3c, P3.17). `generated_by` is a free-form
 * label (e.g. `agent`, `admin@sentinel.local`) since the source can be either
 * the AI Agent service or a logged-in user.
 *
 * @property int $id
 * @property int $incident_id
 * @property string $report_markdown
 * @property ?string $generated_by
 * @property ?Carbon $generated_at
 * @property ?Carbon $created_at
 */
class IncidentReport extends Model
{
    /** @use HasFactory<IncidentReportFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Incident, $this>
     */
    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }
}
