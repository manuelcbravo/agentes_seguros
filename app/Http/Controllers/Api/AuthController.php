<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseApiController
{
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
