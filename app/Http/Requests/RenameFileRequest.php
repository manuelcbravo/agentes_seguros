<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenameFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'related_table' => ['required', 'string', 'max:80'],
            'related_uuid' => ['required', 'uuid'],
            'original_name' => ['required', 'string', 'max:200'],
        ];
    }
}

