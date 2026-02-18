<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertCurrencyRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->input('id');

        return [
            'id' => ['nullable', 'uuid', 'exists:cat_currencies,id'],
            'code' => ['required', 'string', 'max:20', Rule::unique('cat_currencies', 'code')->ignore($id)],
            'name' => ['required', 'string', 'max:150', Rule::unique('cat_currencies', 'name')->ignore($id)],
        ];
    }
}
