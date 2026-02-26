<?php

namespace Tests\Feature;

use App\Mail\ApiClientActivationMail;
use App\Models\ApiClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ApiAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_register_and_receive_activation_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nuevo Cliente',
            'email' => 'nuevo@example.com',
            'password' => 'secreto123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Registro exitoso. Revisa tu correo para activar tu cuenta.')
            ->assertJsonPath('data.client.email', 'nuevo@example.com')
            ->assertJsonPath('data.client.is_active', false)
            ->assertJsonPath('errors', null);

        $client = ApiClient::query()->where('email', 'nuevo@example.com')->firstOrFail();

        $this->assertNotNull($client->activation_token);

        Mail::assertSent(ApiClientActivationMail::class, function (ApiClientActivationMail $mail) use ($client): bool {
            return $mail->hasTo($client->email) && str_contains($mail->activationUrl, $client->activation_token);
        });
    }

    public function test_client_can_activate_account_and_then_login(): void
    {
        $client = ApiClient::query()->create([
            'name' => 'Cliente API',
            'email' => 'api@example.com',
            'password' => 'secret123',
            'is_active' => false,
            'activation_token' => 'token-de-prueba',
        ]);

        $this->getJson('/api/auth/activate/token-de-prueba')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Cuenta activada correctamente')
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonPath('data.client.is_active', true);

        $client->refresh();
        $this->assertTrue($client->is_active);
        $this->assertNull($client->activation_token);

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
