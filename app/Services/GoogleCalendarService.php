<?php

namespace App\Services;

use App\Models\Agent;
use Carbon\Carbon;
use Google\Client;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Support\Arr;
use RuntimeException;

class GoogleCalendarService
{
    private const SCOPE = 'https://www.googleapis.com/auth/calendar';

    public function getAuthUrl(): string
    {
        $client = $this->makeClient();

        return $client->createAuthUrl();
    }

    public function fetchTokenFromCode(string $code): array
    {
        $client = $this->makeClient();
        $token = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new RuntimeException('No se pudo obtener el token de Google Calendar.');
        }

        return $token;
    }

    public function calendar(Agent $agent): Calendar
    {
        if (! $agent->google_access_token && ! $agent->google_refresh_token) {
            throw new RuntimeException('El agente no tiene una conexión activa con Google Calendar.');
        }

        $client = $this->makeClient();

        $expiresIn = $agent->google_token_expires_at
            ? max(0, now()->diffInSeconds($agent->google_token_expires_at, false))
            : null;

        $accessToken = [
            'access_token' => $agent->google_access_token,
            'refresh_token' => $agent->google_refresh_token,
            'expires_in' => $expiresIn,
            'created' => now()->timestamp,
        ];

        $client->setAccessToken($accessToken);

        if ($client->isAccessTokenExpired()) {
            if (! $agent->google_refresh_token) {
                throw new RuntimeException('La conexión con Google Calendar expiró y no hay refresh token.');
            }

            $newToken = $client->fetchAccessTokenWithRefreshToken($agent->google_refresh_token);

            if (isset($newToken['error'])) {
                throw new RuntimeException('No se pudo refrescar el token de Google Calendar.');
            }

            $agent->google_access_token = $newToken['access_token'] ?? $agent->google_access_token;

            if (! empty($newToken['refresh_token'])) {
                $agent->google_refresh_token = $newToken['refresh_token'];
            }

            if (isset($newToken['expires_in'])) {
                $agent->google_token_expires_at = now()->addSeconds((int) $newToken['expires_in']);
            }

            $agent->save();

            $client->setAccessToken([
                'access_token' => $agent->google_access_token,
                'refresh_token' => $agent->google_refresh_token,
                'expires_in' => isset($newToken['expires_in']) ? (int) $newToken['expires_in'] : null,
                'created' => now()->timestamp,
            ]);
        }

        return new Calendar($client);
    }

    public function listEvents(Agent $agent, Carbon $start, Carbon $end): array
    {
        $calendar = $this->calendar($agent);
        $calendarId = $agent->google_calendar_id ?? 'primary';

        $events = $calendar->events->listEvents($calendarId, [
            'timeMin' => $start->copy()->utc()->toRfc3339String(),
            'timeMax' => $end->copy()->utc()->toRfc3339String(),
            'singleEvents' => true,
            'orderBy' => 'startTime',
        ]);

        $agent->forceFill(['google_last_sync_at' => now()])->save();

        return array_map(fn (Event $event) => $this->mapEvent($event), $events->getItems());
    }

    public function createEvent(Agent $agent, array $data): array
    {
        $calendar = $this->calendar($agent);
        $calendarId = $agent->google_calendar_id ?? 'primary';

        $event = $calendar->events->insert($calendarId, new Event($this->toGoogleEventPayload($data)));

        $agent->forceFill(['google_last_sync_at' => now()])->save();

        return $this->mapEvent($event);
    }

    public function updateEvent(Agent $agent, string $eventId, array $data): array
    {
        $calendar = $this->calendar($agent);
        $calendarId = $agent->google_calendar_id ?? 'primary';

        $event = $calendar->events->get($calendarId, $eventId);
        $payload = $this->toGoogleEventPayload($data);

        $event->setSummary($payload['summary']);
        $event->setStart(new EventDateTime($payload['start']));
        $event->setEnd(isset($payload['end']) ? new EventDateTime($payload['end']) : null);
        $event->setDescription($payload['description'] ?? null);
        $event->setLocation($payload['location'] ?? null);

        $updated = $calendar->events->update($calendarId, $eventId, $event);

        $agent->forceFill(['google_last_sync_at' => now()])->save();

        return $this->mapEvent($updated);
    }

    public function deleteEvent(Agent $agent, string $eventId): void
    {
        $calendar = $this->calendar($agent);
        $calendarId = $agent->google_calendar_id ?? 'primary';

        $calendar->events->delete($calendarId, $eventId);

        $agent->forceFill(['google_last_sync_at' => now()])->save();
    }

    private function makeClient(): Client
    {
        $client = new Client();
        $client->setClientId((string) config('services.google.client_id'));
        $client->setClientSecret((string) config('services.google.client_secret'));
        $client->setRedirectUri((string) config('services.google.redirect'));
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setIncludeGrantedScopes(true);
        $client->setScopes([self::SCOPE]);

        return $client;
    }

    private function toGoogleEventPayload(array $data): array
    {
        $allDay = (bool) Arr::get($data, 'allDay', false);
        $start = Carbon::parse((string) $data['start']);
        $end = Arr::get($data, 'end') ? Carbon::parse((string) $data['end']) : null;

        return [
            'summary' => $data['title'],
            'description' => Arr::get($data, 'description'),
            'location' => Arr::get($data, 'location'),
            'start' => $allDay
                ? ['date' => $start->toDateString()]
                : ['dateTime' => $start->toRfc3339String(), 'timeZone' => config('app.timezone')],
            'end' => $end
                ? ($allDay
                    ? ['date' => $end->toDateString()]
                    : ['dateTime' => $end->toRfc3339String(), 'timeZone' => config('app.timezone')])
                : null,
        ];
    }

    private function mapEvent(Event $event): array
    {
        $start = $event->getStart();
        $end = $event->getEnd();

        return [
            'id' => $event->getId(),
            'title' => $event->getSummary() ?? '(Sin título)',
            'start' => $start?->getDateTime() ?? $start?->getDate(),
            'end' => $end?->getDateTime() ?? $end?->getDate(),
            'allDay' => $start?->getDate() !== null,
            'extendedProps' => [
                'description' => $event->getDescription(),
                'location' => $event->getLocation(),
            ],
        ];
    }
}
