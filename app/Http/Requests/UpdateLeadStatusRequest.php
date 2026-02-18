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
            'status' => ['required', 'in:nuevo,contacto_intento,contactado,perfilado,cotizacion_enviada,seguimiento,en_tramite,ganado,no_interesado'],
        ];
    }
}
