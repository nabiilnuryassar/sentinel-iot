<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Issue a single Sanctum `bot` token for the Telegram bot.
 *
 * Output discipline: one line on stdout — `BOT_API_TOKEN=<plaintext>` — so
 * a `make` target / CI script can `eval` it. Everything else (info, errors,
 * already-revoked notice) goes through the Laravel info channel which
 * Symfony routes to stderr by default.
 */
class IssueTokens extends Command
{
    protected $signature = 'sentinel:issue-tokens {--user=admin@sentinel.local : User email to issue tokens for}';

    protected $description = 'Issue a Sanctum bot token for the Telegram bot, revoking any prior `bot` tokens for the same user.';

    public function handle(): int
    {
        $email = (string) $this->option('user');

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            $this->components->error("No user found with email [{$email}].");

            return self::FAILURE;
        }

        $revoked = $user->tokens()->where('name', 'bot')->delete();

        if ($revoked > 0) {
            $this->components->info("Revoked {$revoked} existing `bot` token(s) for {$email}.");
        }

        $token = $user->createToken('bot')->plainTextToken;

        $this->getOutput()->writeln("BOT_API_TOKEN={$token}");

        return self::SUCCESS;
    }
}
