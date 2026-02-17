<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreFileRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'],
            'table_id' => ['required', 'string', 'max:80'],
            'related_id' => ['required', 'integer', 'min:1'],
        ];
    }
}
