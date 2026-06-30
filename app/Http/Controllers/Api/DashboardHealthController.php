<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ServiceHealthChecker;
use Illuminate\Http\JsonResponse;

class DashboardHealthController extends Controller
{
    public function __construct(private readonly ServiceHealthChecker $checker) {}

    public function health(): JsonResponse
    {
        return response()->json($this->checker->check());
    }
}
