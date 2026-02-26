<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAgentProfileRequest;
use App\Models\AgentProfile;
use App\Models\AgentProfileViewStat;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentProfileController extends Controller
{
    public function edit(): Response
    {
        $agent = auth()->user()?->agent;
        abort_unless($agent, 403);

        $profile = $agent->profile;

        if (! $profile) {
            $profile = AgentProfile::query()->create([
                'agent_id' => $agent->id,
                'display_name' => $agent->name,
                'email_public' => $agent->email,
                'phone_public' => $agent->phone,
                'city' => $agent->city,
                'state' => $agent->state,
                'public_slug' => $this->makeUniqueSlug($agent->name ?: (string) $agent->id),
            ]);
        }

        $today = now()->toDateString();
        $lastThirtyDaysStart = now()->subDays(29)->toDateString();
        $lastSevenDaysStart = now()->subDays(6)->startOfDay();
        $lastThirtyDaysStartDateTime = now()->subDays(29)->startOfDay();

        $viewsToday = AgentProfileViewStat::query()
            ->where('agent_id', $agent->id)
            ->where('date', $today)
            ->sum('views_total');

        $viewsLastThirtyDays = AgentProfileViewStat::query()
            ->where('agent_id', $agent->id)
            ->whereBetween('date', [$lastThirtyDaysStart, $today])
            ->sum('views_total');

        $leadsBaseQuery = Lead::query()
            ->where('agent_id', $agent->id)
            ->where('source', 'perfil_web');

        $leadsLastSevenDays = (clone $leadsBaseQuery)
            ->where('created_at', '>=', $lastSevenDaysStart)
            ->count();

        $leadsLastThirtyDays = (clone $leadsBaseQuery)
            ->where('created_at', '>=', $lastThirtyDaysStartDateTime)
            ->count();

        $leadsTotal = (clone $leadsBaseQuery)->count();

        $recentProfileLeads = (clone $leadsBaseQuery)
            ->latest('created_at')
            ->limit(5)
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'source', 'created_at'])
            ->map(fn (Lead $lead) => [
                'id' => $lead->id,
                'full_name' => $lead->full_name,
                'source' => $lead->source,
                'created_at' => $lead->created_at?->toIso8601String(),
            ])
            ->values();

        $conversionRate = $viewsLastThirtyDays > 0
            ? round(($leadsLastThirtyDays / $viewsLastThirtyDays) * 100, 2)
            : 0;

        return Inertia::render('agent-profile/edit', [
            'summary' => [
                'views_today' => $viewsToday,
                'views_last_30_days' => $viewsLastThirtyDays,
                'leads_last_7_days' => $leadsLastSevenDays,
                'leads_last_30_days' => $leadsLastThirtyDays,
                'leads_total' => $leadsTotal,
                'conversion_rate' => $conversionRate,
                'recent_profile_leads' => $recentProfileLeads,
            ],
            'profile' => [
                ...$profile->only([
                    'display_name', 'headline', 'bio', 'profile_photo_path', 'cover_image_path', 'brand_color', 'logo_path',
                    'email_public', 'phone_public', 'whatsapp_public', 'website_url', 'address_public', 'city', 'state',
                    'service_areas', 'languages', 'working_hours', 'specialties', 'insurers', 'cta_title', 'cta_description',
                    'public_slug', 'is_public_enabled', 'contact_form_enabled', 'show_licenses', 'last_published_at',
                ]),
                'profile_photo_url' => $profile->profile_photo_path ? Storage::disk('public')->url($profile->profile_photo_path) : null,
                'cover_image_url' => $profile->cover_image_path ? Storage::disk('public')->url($profile->cover_image_path) : null,
                'logo_url' => $profile->logo_path ? Storage::disk('public')->url($profile->logo_path) : null,
            ],
        ]);
    }

    public function update(UpdateAgentProfileRequest $request): RedirectResponse
    {
        $agent = $request->user()?->agent;
        abort_unless($agent, 403);

        $profile = $agent->profile ?? AgentProfile::query()->create([
            'agent_id' => $agent->id,
            'display_name' => $agent->name,
            'public_slug' => $this->makeUniqueSlug($agent->name ?: (string) $agent->id),
        ]);

        $data = $request->validated();
        $wasPublicEnabled = (bool) $profile->is_public_enabled;

        $profile->fill([
            'display_name' => $data['display_name'],
            'headline' => $data['headline'] ?? null,
            'bio' => $data['bio'] ?? null,
            'brand_color' => $data['brand_color'] ?? null,
            'email_public' => $data['email_public'] ?? null,
            'phone_public' => $data['phone_public'] ?? null,
            'whatsapp_public' => $data['whatsapp_public'] ?? null,
            'website_url' => $data['website_url'] ?? null,
            'address_public' => $data['address_public'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'service_areas' => array_values(array_filter($data['service_areas'] ?? [], fn ($value) => filled($value))),
            'languages' => array_values(array_filter($data['languages'] ?? [], fn ($value) => filled($value))),
            'working_hours' => $data['working_hours'] ?? null,
            'specialties' => array_values(array_filter($data['specialties'] ?? [], fn ($value) => filled($value))),
            'insurers' => array_values(array_filter($data['insurers'] ?? [], fn ($value) => filled($value))),
            'cta_title' => $data['cta_title'] ?? null,
            'cta_description' => $data['cta_description'] ?? null,
            'public_slug' => Str::slug($data['public_slug']),
            'is_public_enabled' => $data['is_public_enabled'],
            'contact_form_enabled' => $data['contact_form_enabled'],
            'show_licenses' => $data['show_licenses'],
        ]);

        if ($request->hasFile('profile_photo')) {
            if ($profile->profile_photo_path && str_starts_with($profile->profile_photo_path, 'agent-profiles/profile-photo/')) {
                Storage::disk('public')->delete($profile->profile_photo_path);
            }

            $profile->profile_photo_path = $request->file('profile_photo')->store('agent-profiles/profile-photo', 'public');
        }

        if ($request->hasFile('cover_image')) {
            if ($profile->cover_image_path && str_starts_with($profile->cover_image_path, 'agent-profiles/cover-image/')) {
                Storage::disk('public')->delete($profile->cover_image_path);
            }

            $profile->cover_image_path = $request->file('cover_image')->store('agent-profiles/cover-image', 'public');
        }

        if ($request->hasFile('logo_image')) {
            if ($profile->logo_path && str_starts_with($profile->logo_path, 'agent-profiles/logo/')) {
                Storage::disk('public')->delete($profile->logo_path);
            }

            $profile->logo_path = $request->file('logo_image')->store('agent-profiles/logo', 'public');
        }

        if (! $wasPublicEnabled && $profile->is_public_enabled && ! $profile->last_published_at) {
            $profile->last_published_at = Carbon::now();
        }

        $profile->save();

        return back()->with('success', 'Perfil guardado correctamente');
    }

    private function makeUniqueSlug(string $value): string
    {
        $base = Str::slug($value);
        $root = filled($base) ? $base : 'agente';
        $slug = $root;
        $suffix = 1;

        while (AgentProfile::query()->where('public_slug', $slug)->exists()) {
            $slug = $root.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
