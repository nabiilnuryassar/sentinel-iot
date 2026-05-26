<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Liveness probe — public endpoint, no auth, no DB hit.
 *
 * Sized for the Telegram bot's startup check and any external uptime monitor.
 */
class HealthController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => Carbon::now()->toIso8601String(),
        ]);
    }
}
