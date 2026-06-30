<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class TenantProvision extends Command
{
    protected $signature = 'tenant:provision {slug} {--force : Overwrite existing credentials}';

    protected $description = 'Provision MQTT credentials for a new tenant';

    public function handle(): int
    {
        $slug = $this->argument('slug');
        $passwordFile = base_path('mosquitto/secrets/passwordfile');

        if (! File::exists($passwordFile)) {
            $this->error("Password file not found: {$passwordFile}");
            $this->info('Run: mkdir -p mosquitto/secrets && touch mosquitto/secrets/passwordfile');

            return 1;
        }

        $existing = File::get($passwordFile);
        if (preg_match("/^{$slug}:/m", $existing) && ! $this->option('force')) {
            $this->error("Tenant '{$slug}' already exists. Use --force to regenerate.");

            return 1;
        }

        $password = Str::password(32);

        // Call mosquitto_passwd to generate bcrypt hash
        $hash = trim(shell_exec("echo '{$password}' | mosquitto_passwd -n '{$slug}' 2>/dev/null | cut -d: -f2"));

        if (empty($hash)) {
            $this->error('Failed to generate password hash');

            return 1;
        }

        // Update password file
        $lines = array_filter(explode("\n", $existing), fn ($line) => ! preg_match("/^{$slug}:/", trim($line)));
        $lines[] = "{$slug}:{$hash}";
        File::put($passwordFile, implode("\n", array_filter($lines))."\n");

        $this->newLine();
        $this->info("✓ Tenant '{$slug}' provisioned successfully");
        $this->newLine();
        $this->warn('MQTT Credentials:');
        $this->line("  Username: {$slug}");
        $this->line("  Password: {$password}");
        $this->newLine();
        $this->warn('Topic Namespace:');
        $this->line("  Publish: tenants/{$slug}/iot/<building>/<room>/<device_id>/telemetry");
        $this->line("  Events:  tenants/{$slug}/iot/<building>/<room>/<device_id>/event");
        $this->newLine();
        $this->info('Reload broker: docker compose restart mosquitto');

        return 0;
    }
}
