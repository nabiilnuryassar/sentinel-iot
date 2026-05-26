<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Default Laravel 11+ wiring calls route('login') for unauthenticated
        // requests, which blows up with RouteNotFoundException because we
        // don't ship a login route. For /api/* we want a clean 401 JSON
        // response, so short-circuit the redirect there.
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON responses (incl. 401 for unauthenticated) on every /api/* route
        // so the Telegram bot — and curl smoke tests — never get redirected to
        // the web login route when they forget to send `Accept: application/json`.
        $exceptions->shouldRenderJsonWhen(
            fn ($request, $e) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
