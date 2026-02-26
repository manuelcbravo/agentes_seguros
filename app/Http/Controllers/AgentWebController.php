<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAgentWebSettingsRequest;
use App\Models\AgentProfile;
use App\Models\AgentProfileViewStat;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentWebController extends Controller
{
    public function edit(): Response
    {
        $agent = auth()->user()?->agent;
        abort_unless($agent, 403);

        $profile = $this->findOrCreateProfile($agent);

        $today = now()->toDateString();
        $lastThirtyDaysStart = now()->subDays(29)->toDateString();
        $lastThirtyDaysStartDateTime = now()->subDays(29)->startOfDay();

        $viewsLastThirtyDays = AgentProfileViewStat::query()
            ->where('agent_id', $agent->id)
            ->whereBetween('date', [$lastThirtyDaysStart, $today])
            ->sum('views_total');

        $viewsTotal = AgentProfileViewStat::query()
            ->where('agent_id', $agent->id)
            ->sum('views_total');

        $leadsQuery = Lead::query()
            ->where('agent_id', $agent->id)
            ->where('source', 'perfil_web');

        $leadsLastThirtyDays = (clone $leadsQuery)
            ->where('created_at', '>=', $lastThirtyDaysStartDateTime)
            ->count();

        $recentProfileLeads = (clone $leadsQuery)
            ->latest('created_at')
            ->limit(8)
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'phone', 'metadata', 'created_at'])
            ->map(fn (Lead $lead) => [
                'id' => $lead->id,
                'full_name' => $lead->full_name,
                'phone' => $lead->phone,
                'product_interest' => data_get($lead->metadata, 'product_interest'),
                'created_at' => $lead->created_at?->toIso8601String(),
            ])->values();

        return Inertia::render('agents/web', [
            'profile' => $profile->only(['public_slug', 'is_public_enabled', 'contact_form_enabled', 'show_licenses', 'last_published_at', 'bio', 'phone_public', 'whatsapp_public', 'profile_photo_path']),
            'metrics' => [
                'views_last_30_days' => $viewsLastThirtyDays,
                'views_total' => $viewsTotal,
                'leads_last_30_days' => $leadsLastThirtyDays,
                'conversion_rate' => $viewsLastThirtyDays > 0 ? round(($leadsLastThirtyDays / $viewsLastThirtyDays) * 100, 2) : 0,
                'recent_profile_leads' => $recentProfileLeads,
            ],
            'profile_completion_warnings' => [
                'missing_profile_photo' => blank($profile->profile_photo_path),
                'missing_phone_or_whatsapp' => blank($profile->phone_public) && blank($profile->whatsapp_public),
                'missing_bio' => blank($profile->bio),
            ],
        ]);
    }

    public function update(UpdateAgentWebSettingsRequest $request): RedirectResponse
    {
        $agent = $request->user()?->agent;
        abort_unless($agent, 403);

        $profile = $this->findOrCreateProfile($agent);
        $data = $request->validated();
        $wasPublicEnabled = (bool) $profile->is_public_enabled;

        $profile->fill([
            'is_public_enabled' => $data['is_public_enabled'],
            'contact_form_enabled' => $data['contact_form_enabled'],
            'show_licenses' => $data['show_licenses'],
        ]);

        if (! $wasPublicEnabled && $profile->is_public_enabled && ! $profile->last_published_at) {
            $profile->last_published_at = Carbon::now();
        }

        $profile->save();

        return back()->with('success', 'Configuración web guardada correctamente');
    }

    private function findOrCreateProfile(mixed $agent): AgentProfile
    {
        return $agent->profile ?? AgentProfile::query()->create([
            'agent_id' => $agent->id,
            'display_name' => $agent->name,
            'email_public' => $agent->email,
            'phone_public' => $agent->phone,
            'city' => $agent->city,
            'state' => $agent->state,
            'public_slug' => $this->makeUniqueSlug($agent->name ?: (string) $agent->id),
        ]);
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
