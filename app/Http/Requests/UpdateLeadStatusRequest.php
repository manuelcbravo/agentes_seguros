<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadStatusRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:nuevo,contactado,perfilado,en_pausa,seguimiento,en_tramite,ganado,no_interesado'],
        ];
    }
}
