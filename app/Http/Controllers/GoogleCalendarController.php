<?php

namespace App\Http\Controllers;

use App\Services\GoogleCalendarService;
use Carbon\Carbon;
use Google\Client;
use Google\Service\Oauth2;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class GoogleCalendarController extends Controller
{
    public function __construct(private readonly GoogleCalendarService $service)
    {
    }

    public function index(): Response
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        return Inertia::render('calendario/google-calendar', [
            'connected' => ! empty($agent->google_access_token) || ! empty($agent->google_refresh_token),
            'google_email' => $agent->google_email,
            'google_calendar_id' => $agent->google_calendar_id,
            'google_connected_at' => $agent->google_connected_at?->toIso8601String(),
        ]);
    }

    public function connect(): RedirectResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        return redirect()->away($this->service->getAuthUrl());
    }

    public function callback(Request $request): RedirectResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        try {
            $token = $this->service->fetchTokenFromCode($validated['code']);

            $agent->google_access_token = $token['access_token'] ?? null;
            if (! empty($token['refresh_token'])) {
                $agent->google_refresh_token = $token['refresh_token'];
            }
            $agent->google_token_expires_at = isset($token['expires_in'])
                ? now()->addSeconds((int) $token['expires_in'])
                : null;
            $agent->google_scopes = isset($token['scope']) ? explode(' ', $token['scope']) : null;
            $agent->google_connected_at = now();
            $agent->google_disconnected_at = null;
            $agent->google_calendar_id = $agent->google_calendar_id ?: 'primary';

            try {
                $oauthClient = new Client();
                $oauthClient->setClientId((string) config('services.google.client_id'));
                $oauthClient->setClientSecret((string) config('services.google.client_secret'));
                $oauthClient->setRedirectUri((string) config('services.google.redirect'));
                $oauthClient->setAccessToken([
                    'access_token' => $agent->google_access_token,
                    'refresh_token' => $agent->google_refresh_token,
                ]);
                $oauth2 = new Oauth2($oauthClient);
                $profile = $oauth2->userinfo->get();
                if ($profile->getEmail()) {
                    $agent->google_email = $profile->getEmail();
                }
            } catch (\Throwable $emailError) {
                Log::warning('No se pudo obtener el email de Google del agente.', [
                    'agent_id' => $agent->id,
                    'error' => $emailError->getMessage(),
                ]);
            }

            $agent->save();

            return redirect()->route('google-calendar.index')
                ->with('success', 'Google Calendar conectado correctamente.');
        } catch (\Throwable $exception) {
            Log::error('Error conectando Google Calendar.', [
                'agent_id' => $agent->id,
                'error' => $exception->getMessage(),
            ]);

            return redirect()->route('google-calendar.index')
                ->with('error', 'No se pudo conectar Google Calendar. Intenta nuevamente.');
        }
    }

    public function disconnect(): RedirectResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        $agent->forceFill([
            'google_access_token' => null,
            'google_refresh_token' => null,
            'google_token_expires_at' => null,
            'google_scopes' => null,
            'google_disconnected_at' => now(),
        ])->save();

        return redirect()->route('google-calendar.index')
            ->with('success', 'Google Calendar desconectado correctamente.');
    }

    public function eventsIndex(Request $request): JsonResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        $validated = $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        try {
            $events = $this->service->listEvents(
                $agent,
                Carbon::parse($validated['start']),
                Carbon::parse($validated['end']),
            );

            return response()->json($events);
        } catch (\Throwable $exception) {
            return $this->tokenErrorResponse($exception);
        }
    }

    public function eventsStore(Request $request): JsonResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'start' => ['required', 'date'],
            'end' => ['nullable', 'date', 'after_or_equal:start'],
            'allDay' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            return response()->json($this->service->createEvent($agent, $validated), 201);
        } catch (\Throwable $exception) {
            return $this->tokenErrorResponse($exception);
        }
    }

    public function eventsUpdate(Request $request, string $eventId): JsonResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'start' => ['required', 'date'],
            'end' => ['nullable', 'date', 'after_or_equal:start'],
            'allDay' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            return response()->json($this->service->updateEvent($agent, $eventId, $validated));
        } catch (\Throwable $exception) {
            return $this->tokenErrorResponse($exception);
        }
    }

    public function eventsDestroy(string $eventId): HttpResponse|JsonResponse
    {
        $agent = auth()->user()?->agent;

        abort_unless($agent, 403);

        try {
            $this->service->deleteEvent($agent, $eventId);

            return response()->noContent();
        } catch (\Throwable $exception) {
            return $this->tokenErrorResponse($exception);
        }
    }

    private function tokenErrorResponse(\Throwable $exception): JsonResponse
    {
        $message = $exception instanceof RuntimeException
            ? 'Tu conexión con Google expiró, vuelve a conectar.'
            : 'Ocurrió un error al sincronizar Google Calendar.';

        $status = $exception instanceof RuntimeException ? 401 : 500;

        return response()->json([
            'message' => $message,
        ], $status);
    }
}
