<?php

namespace App\Http\Controllers\Api;

use App\Mail\ApiClientActivationMail;
use App\Models\ApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:api_clients,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $client = ApiClient::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_active' => false,
            'activation_token' => Str::random(64),
            'activation_sent_at' => now(),
        ]);

        $activationUrl = url("/api/auth/activate/{$client->activation_token}");

        Mail::to($client->email)->send(new ApiClientActivationMail($client, $activationUrl));

        return $this->success([
            'client' => $client->only(['id', 'name', 'email', 'is_active']),
        ], 'Registro exitoso. Revisa tu correo para activar tu cuenta.', 201);
    }

    public function activate(string $token): JsonResponse
    {
        $client = ApiClient::query()->where('activation_token', $token)->first();

        if (! $client) {
            return $this->error('Token de activación inválido', null, 404);
        }

        if ($client->is_active) {
            return $this->success([
                'client' => $client->only(['id', 'name', 'email', 'is_active']),
            ], 'La cuenta ya estaba activada');
        }

        $client->forceFill([
            'is_active' => true,
            'activated_at' => now(),
            'activation_token' => null,
        ])->save();

        return $this->success([
            'client' => $client->only(['id', 'name', 'email', 'is_active']),
        ], 'Cuenta activada correctamente');
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $client = ApiClient::query()->where('email', $validated['email'])->first();

        if (! $client || ! $client->is_active || ! Hash::check($validated['password'], $client->password)) {
            return $this->unauthorized('Credenciales incorrectas');
        }

        $client->forceFill([
            'last_login_at' => now(),
        ])->save();

        $deviceName = $validated['device_name'] ?? $request->userAgent() ?? 'api-client';
        $token = $client->createToken($deviceName)->plainTextToken;

        return $this->success([
            'token' => $token,
            'token_type' => 'Bearer',
            'client' => $client,
        ], 'Login exitoso');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->success(null, 'Sesión cerrada correctamente');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success($request->user(), 'Perfil obtenido');
    }

    public function revokeAllTokens(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return $this->success(null, 'Todas las sesiones fueron revocadas');
    }
}
