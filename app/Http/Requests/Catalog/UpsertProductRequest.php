<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertProductRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->input('id');

        return [
            'id' => ['nullable', 'uuid', 'exists:products,id'],
            'insurance_company_id' => ['required', 'uuid', 'exists:cat_insurance_companies,id'],
            'product_type_id' => ['required', 'uuid', 'exists:cat_product_types,id'],
            'code' => ['required', 'string', 'max:50', Rule::unique('products', 'code')->ignore($id)],
            'name' => ['required', 'string', 'max:150', Rule::unique('products', 'name')->ignore($id)],
        ];
    }
}
