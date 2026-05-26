# Runbook

This document details common developer commands for building, linting, testing, and running Sentinel-IoT.

## Getting Started

1. **Install Dependencies:**
   - Backend: `composer install`
   - Frontend: `npm install`

2. **Environment Configuration:**
   - Copy `.env.example` to `.env` and set necessary variables.

3. **Running the Application locally:**
   - Start Vite Dev Server: `npm run dev`
   - Start Laravel server: `php artisan serve`

## Testing

To run the full test suite using Pest/PHPUnit:

```bash
docker exec sentinel-laravel php artisan test --compact
```

Or run it locally if PHP and SQLite/database are configured:

```bash
php artisan test --compact
```

## Linting and Code Styling

Ensure all code follows the strict code-quality guidelines:

1. **PHP Formatting (Laravel Pint):**
   ```bash
   docker exec sentinel-laravel vendor/bin/pint --dirty --format agent
   ```
2. **Frontend Type Checks:**
   ```bash
   npm run types:check
   ```
3. **Frontend Linter:**
   ```bash
   npm run lint:check
   ```

## Production Frontend Bundling

Compile production assets with Vite:

```bash
npm run build
```
