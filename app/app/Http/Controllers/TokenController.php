<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class TokenController extends Controller
{
    /**
     * Rotate the Sanctum bot token for the authenticated user and write it to the .env file.
     */
    public function rotate(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        // 1. Revoke existing 'bot' tokens
        $user->tokens()->where('name', 'bot')->delete();

        // 2. Create new 'bot' token
        $token = $user->createToken('bot')->plainTextToken;

        // 3. Write it to .env
        $envPath = base_path('.env');
        if (File::exists($envPath)) {
            $content = File::get($envPath);
            if (preg_match('/^LARAVEL_API_TOKEN=/m', $content) === 1) {
                $content = (string) preg_replace('/^LARAVEL_API_TOKEN=.*$/m', 'LARAVEL_API_TOKEN='.$token, $content);
            } else {
                $content .= "\nLARAVEL_API_TOKEN=".$token;
            }
            File::put($envPath, $content);
        }

        return redirect()
            ->back()
            ->with('status', 'Bot token rotated successfully.')
            ->with('new_bot_token', $token);
    }
}
