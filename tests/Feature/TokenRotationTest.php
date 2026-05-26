<?php

use App\Models\User;
use Illuminate\Support\Facades\File;

it('requires authentication to rotate token', function (): void {
    $this->post(route('tokens.rotate'))
        ->assertRedirect(route('login'));
});

it('rotates the bot token for the authenticated user and updates .env', function (): void {
    $user = User::factory()->create();

    // Mock File facade to avoid overwriting real .env in tests
    File::shouldReceive('exists')
        ->once()
        ->with(base_path('.env'))
        ->andReturn(true);

    File::shouldReceive('get')
        ->once()
        ->with(base_path('.env'))
        ->andReturn("LARAVEL_API_TOKEN=old_token\nOTHER_KEY=val");

    File::shouldReceive('put')
        ->once()
        ->with(base_path('.env'), Mockery::on(function (string $content): bool {
            return str_contains($content, 'LARAVEL_API_TOKEN=')
                && ! str_contains($content, 'LARAVEL_API_TOKEN=old_token');
        }));

    $response = $this->actingAs($user)
        ->post(route('tokens.rotate'));

    $response->assertRedirect();
    $response->assertSessionHas('status', 'Bot token rotated successfully.');
    $response->assertSessionHas('new_bot_token');

    // Verify token was created
    expect($user->tokens()->where('name', 'bot')->count())->toBe(1);
});
