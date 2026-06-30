<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Log every mutating request (POST/PUT/PATCH/DELETE) from authenticated users
 * to the `audit_logs` table.
 *
 * Registered in bootstrap/app.php as web middleware.
 */
class AuditAdminActions
{
    /**
     * Actions that should be logged even when unauthenticated (e.g. login attempts).
     */
    private const ALWAYS_LOG_ROUTES = [
        'login',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log mutating requests
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        $user = $request->user();
        $routeName = $request->route()?->getName() ?? '';

        // Skip if no user and not an always-log route
        if (! $user && ! in_array($routeName, self::ALWAYS_LOG_ROUTES, true)) {
            return $response;
        }

        // Don't log failed validation responses
        if ($response->getStatusCode() === 422) {
            return $response;
        }

        AuditLog::query()->create([
            'user_id' => $user?->id,
            'action' => $this->resolveAction($request, $routeName),
            'resource_type' => $this->resolveResourceType($request),
            'resource_id' => $this->resolveResourceId($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $response;
    }

    private function resolveAction(Request $request, string $routeName): string
    {
        // Use route name if available, fallback to method + path
        if ($routeName !== '') {
            return $routeName;
        }

        return strtolower($request->method()).':'.$request->path();
    }

    private function resolveResourceType(Request $request): ?string
    {
        // Extract resource type from path segments
        $segments = $request->segments();

        if (count($segments) >= 2 && $segments[0] === 'api') {
            return $segments[1]; // e.g. "incidents", "devices"
        }

        if (count($segments) >= 1) {
            return $segments[0];
        }

        return null;
    }

    private function resolveResourceId(Request $request): ?int
    {
        // Look for route model binding parameter
        $route = $request->route();

        if (! $route) {
            return null;
        }

        // Check common parameter names
        foreach (['incident', 'device', 'user'] as $param) {
            $model = $route->parameter($param);
            if (is_object($model) && method_exists($model, 'getKey')) {
                return $model->getKey();
            }
        }

        return null;
    }
}
