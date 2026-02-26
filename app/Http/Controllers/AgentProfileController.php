<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAgentProfileDetailsRequest;
use App\Models\AgentProfile;
use Illuminate\Http\RedirectResponse;
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

        $profile = $this->findOrCreateProfile($agent);

        return Inertia::render('agents/profile', [
            'profile' => [
                ...$profile->only([
                    'display_name', 'headline', 'bio', 'email_public', 'phone_public', 'whatsapp_public', 'website_url',
                    'city', 'state', 'service_areas', 'specialties', 'insurers', 'public_slug',
                ]),
                'profile_photo_url' => $profile->profile_photo_path ? Storage::disk('public')->url($profile->profile_photo_path) : null,
                'cover_image_url' => $profile->cover_image_path ? Storage::disk('public')->url($profile->cover_image_path) : null,
            ],
        ]);
    }

    public function update(UpdateAgentProfileDetailsRequest $request): RedirectResponse
    {
        $agent = $request->user()?->agent;
        abort_unless($agent, 403);

        $profile = $this->findOrCreateProfile($agent);
        $data = $request->validated();

        $profile->fill([
            'display_name' => $data['display_name'],
            'headline' => $data['headline'] ?? null,
            'bio' => $data['bio'] ?? null,
            'email_public' => $data['email_public'] ?? null,
            'phone_public' => $data['phone_public'] ?? null,
            'whatsapp_public' => $data['whatsapp_public'] ?? null,
            'website_url' => $data['website_url'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'service_areas' => array_values(array_filter($data['service_areas'] ?? [], fn ($value) => filled($value))),
            'specialties' => array_values(array_filter($data['specialties'] ?? [], fn ($value) => filled($value))),
            'insurers' => array_values(array_filter($data['insurers'] ?? [], fn ($value) => filled($value))),
        ]);

        if (! $profile->last_published_at && $profile->isDirty('display_name')) {
            $profile->public_slug = $this->makeUniqueSlug($profile->display_name, $profile->id);
        }

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

        $profile->save();

        return back()->with('success', 'Perfil guardado correctamente');
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

    private function makeUniqueSlug(string $value, ?string $ignoreProfileId = null): string
    {
        $base = Str::slug($value);
        $root = filled($base) ? $base : 'agente';
        $slug = $root;
        $suffix = 1;

        while (AgentProfile::query()
            ->when($ignoreProfileId, fn ($query) => $query->where('id', '!=', $ignoreProfileId))
            ->where('public_slug', $slug)
            ->exists()) {
            $slug = $root.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
