<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertRelationshipRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->input('id');

        return [
            'id' => ['nullable', 'uuid', 'exists:cat_relationships,id'],
            'code' => ['required', 'string', 'max:30', Rule::unique('cat_relationships', 'code')->ignore($id)],
            'name' => ['required', 'string', 'max:150', Rule::unique('cat_relationships', 'name')->ignore($id)],
        ];
    }
}
