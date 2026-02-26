<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\AgentProfile;
use Illuminate\Validation\Rule;

class PublicProfileContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $profile = AgentProfile::query()->where('public_slug', (string) $this->route('slug'))->first();
        $allowedSpecialties = is_array($profile?->specialties) ? $profile->specialties : [];

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'product_interest' => ['nullable', 'string', 'max:120', Rule::in($allowedSpecialties)],
            'consent' => ['nullable', 'accepted'],
            'website' => ['nullable', 'max:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'phone' => trim((string) $this->input('phone')),
            'email' => filled($this->input('email')) ? trim((string) $this->input('email')) : null,
            'message' => trim((string) $this->input('message')),
            'product_interest' => filled($this->input('product_interest')) ? trim((string) $this->input('product_interest')) : null,
        ]);
    }
}
