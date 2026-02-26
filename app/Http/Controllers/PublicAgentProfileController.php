<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicProfileContactRequest;
use App\Models\AgentProfile;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicAgentProfileController extends Controller
{
    public function show(string $slug): Response
    {
        $profile = AgentProfile::query()
            ->with(['agent.licenses.insuranceCompany:id,nombre'])
            ->where('public_slug', $slug)
            ->where('is_public_enabled', true)
            ->firstOrFail();

        $licenses = collect();

        if ($profile->show_licenses) {
            $licenses = $profile->agent->licenses
                ->filter(fn ($license) => $license->activo && (! $license->fecha_expiracion || ! $license->fecha_expiracion->isPast()))
                ->values()
                ->map(fn ($license) => [
                    'id' => $license->id,
                    'num_licencia' => $license->num_licencia,
                    'aseguradora' => $license->insuranceCompany?->nombre,
                    'fecha_expiracion' => $license->fecha_expiracion?->toDateString(),
                ]);
        }

        return Inertia::render('public/agent-profile-show', [
            'profile' => [
                ...$profile->only([
                    'display_name', 'headline', 'bio', 'brand_color', 'email_public', 'phone_public', 'whatsapp_public',
                    'website_url', 'address_public', 'city', 'state', 'service_areas', 'languages', 'working_hours',
                    'specialties', 'insurers', 'cta_title', 'cta_description', 'public_slug', 'contact_form_enabled',
                ]),
                'profile_photo_url' => $profile->profile_photo_path ? Storage::disk('public')->url($profile->profile_photo_path) : null,
                'cover_image_url' => $profile->cover_image_path ? Storage::disk('public')->url($profile->cover_image_path) : null,
                'logo_url' => $profile->logo_path ? Storage::disk('public')->url($profile->logo_path) : null,
            ],
            'licenses' => $licenses,
            'csrfToken' => csrf_token(),
        ]);
    }

    public function contact(PublicProfileContactRequest $request, string $slug): RedirectResponse
    {
        $profile = AgentProfile::query()
            ->where('public_slug', $slug)
            ->where('is_public_enabled', true)
            ->where('contact_form_enabled', true)
            ->firstOrFail();

        $rateLimitKey = sprintf('public-profile-contact:%s:%s', $slug, (string) $request->ip());

        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            return back()->with('error', 'Recibimos varios intentos. Intenta de nuevo en un momento.');
        }

        RateLimiter::hit($rateLimitKey, 60);

        $data = $request->validated();
        $nameParts = preg_split('/\s+/', trim($data['name'])) ?: [];

        $firstName = array_shift($nameParts) ?? 'Prospecto';
        $lastName = implode(' ', $nameParts) ?: null;

        Lead::query()->create([
            'agent_id' => $profile->agent_id,
            'first_name' => Str::limit($firstName, 255, ''),
            'last_name' => $lastName ? Str::limit($lastName, 255, '') : null,
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'source' => 'perfil_web',
            'status' => 'nuevo',
            'message' => $data['message'],
            'metadata' => [
                'profile_slug' => $profile->public_slug,
                'product_interest' => $data['product_interest'] ?? null,
                'consent' => (bool) ($data['consent'] ?? false),
                'utm_source' => $request->string('utm_source')->toString() ?: null,
                'utm_medium' => $request->string('utm_medium')->toString() ?: null,
                'utm_campaign' => $request->string('utm_campaign')->toString() ?: null,
                'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            ],
        ]);

        return back()->with('success', 'Gracias, te contactaremos pronto.');
    }
}
