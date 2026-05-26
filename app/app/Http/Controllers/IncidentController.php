<?php

namespace App\Http\Controllers;

use App\Ai\Agents\IncidentAnalyst;
use App\Http\Requests\StoreIncidentRequest;
use App\Http\Requests\UpdateIncidentRequest;
use App\Models\Incident;
use App\Models\IncidentReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IncidentController extends Controller
{
    /**
     * Paginated incidents list — newest first.
     */
    public function index(Request $request): Response
    {
        $incidents = Incident::query()
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $incidents->getCollection()->transform(fn (Incident $incident) => [
            'id' => $incident->id,
            'title' => $incident->title,
            'severity' => $incident->severity,
            'status' => $incident->status,
            'affected_device_id' => $incident->affected_device_id,
            'created_at' => $incident->created_at?->toIso8601String(),
        ]);

        return Inertia::render('incidents/index', [
            'incidents' => $incidents,
        ]);
    }

    public function show(Request $request, Incident $incident): Response
    {
        $incident->load(['reports' => fn ($query) => $query->orderByDesc('generated_at'), 'device']);

        return Inertia::render('incidents/show', [
            'incident' => [
                'id' => $incident->id,
                'title' => $incident->title,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'affected_device_id' => $incident->affected_device_id,
                'summary' => $incident->summary,
                'root_cause' => $incident->root_cause,
                'recommendation' => $incident->recommendation,
                'created_at' => $incident->created_at?->toIso8601String(),
                'updated_at' => $incident->updated_at?->toIso8601String(),
                'device' => $incident->device ? [
                    'device_id' => $incident->device->device_id,
                    'name' => $incident->device->name,
                    'type' => $incident->device->type,
                    'location' => $incident->device->location,
                ] : null,
                'reports' => $incident->reports->map(fn ($report) => [
                    'id' => $report->id,
                    'generated_by' => $report->generated_by,
                    'generated_at' => $report->generated_at?->toIso8601String(),
                    'report_markdown' => $report->report_markdown,
                ])->all(),
            ],
        ]);
    }

    public function store(StoreIncidentRequest $request): RedirectResponse
    {
        $incident = Incident::query()->create([
            ...$request->validated(),
            'status' => Incident::STATUS_OPEN,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('incidents.show', $incident)
            ->with('success', 'Incident created.');
    }

    public function update(UpdateIncidentRequest $request, Incident $incident): RedirectResponse
    {
        $incident->update($request->validated());

        return redirect()
            ->route('incidents.show', $incident)
            ->with('success', 'Incident updated.');
    }

    /**
     * Run the IncidentAnalyst against the incident, persist the markdown
     * report, and update incidents.severity / incidents.recommendation
     * with the agent's structured output.
     */
    public function generateReport(Request $request, Incident $incident): RedirectResponse
    {
        $response = (new IncidentAnalyst)->prompt(
            "Analyze incident #{$incident->id}: {$incident->title}"
        );

        $structured = $response->toArray();

        IncidentReport::query()->create([
            'incident_id' => $incident->id,
            'report_markdown' => $structured['report_markdown'] ?? '',
            'generated_by' => (string) ($request->user()?->id ?? 'agent'),
            'generated_at' => now(),
        ]);

        $incident->update([
            'severity' => $structured['severity'] ?? $incident->severity,
            'recommendation' => $structured['recommendation'] ?? $incident->recommendation,
            'summary' => $structured['summary'] ?? $incident->summary,
            'root_cause' => $structured['root_cause'] ?? $incident->root_cause,
        ]);

        return redirect()
            ->route('incidents.show', $incident)
            ->with('success', 'Report generated.');
    }
}
