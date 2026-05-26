<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Operations dashboard summary as JSON for the Telegram `/status` command.
 *
 * Shape matches PRD §14.1 exactly. Reuses {@see DashboardSummary} so the
 * Inertia dashboard and the bot stay aligned.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardSummary $summary) {}

    public function __invoke(Request $request): JsonResponse
    {
        return response()->json($this->summary->summary());
    }
}
