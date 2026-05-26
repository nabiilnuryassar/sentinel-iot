<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @php
            $viteManifest = public_path('build/manifest.json');
            $vitePrefix = '';

            if (is_file($viteManifest)) {
                $manifest = json_decode(file_get_contents($viteManifest), true) ?: [];
                $cssEntry = collect(array_keys($manifest))->first(
                    fn (string $entry): bool => str_ends_with($entry, 'resources/css/app.css'),
                    'resources/css/app.css',
                );
                $vitePrefix = str_replace('resources/css/app.css', '', $cssEntry);
            }
        @endphp
        @vite([$vitePrefix.'resources/css/app.css', $vitePrefix.'resources/js/app.tsx', $vitePrefix."resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
