<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertSexRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->input('id');

        return [
            'id' => ['nullable', 'uuid', 'exists:cat_sexes,id'],
            'code' => ['required', 'string', 'max:10', Rule::unique('cat_sexes', 'code')->ignore($id)],
            'name' => ['required', 'string', 'max:100', Rule::unique('cat_sexes', 'name')->ignore($id)],
        ];
    }
}
