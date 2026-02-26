<?php

namespace Tests\Feature;

use App\Models\ApiClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_login_and_get_profile_with_standard_response_shape(): void
    {
        $client = ApiClient::query()->create([
            'name' => 'Cliente API',
            'email' => 'api@example.com',
            'password' => 'secret123',
            'is_active' => true,
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'api@example.com',
            'password' => 'secret123',
            'device_name' => 'phpunit',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Login exitoso')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonPath('data.client.email', $client->email)
            ->assertJsonMissingPath('data.client.password')
            ->assertJsonPath('errors', null);

        $token = $loginResponse->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Perfil obtenido')
            ->assertJsonPath('data.email', $client->email)
            ->assertJsonPath('errors', null);
    }

    public function test_inactive_client_cannot_login(): void
    {
        ApiClient::query()->create([
            'name' => 'Cliente Inactivo',
            'email' => 'inactive@example.com',
            'password' => 'secret123',
            'is_active' => false,
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'secret123',
        ])->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Credenciales incorrectas')
            ->assertJsonPath('data', null);
    }

    public function test_validation_errors_use_standard_api_shape(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'correo-no-valido',
        ])->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Errores de validación')
            ->assertJsonPath('data', null)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors' => ['email', 'password'],
            ]);
    }
}
