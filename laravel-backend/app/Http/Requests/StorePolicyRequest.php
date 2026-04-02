<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'policy_name' => ['required', 'string', 'max:255'],
            'phi_categories' => ['nullable', 'array'],
            'phi_categories.*' => ['string', 'max:64'],
            'enforcement_action' => ['nullable', 'string', 'max:64'],
            'confidence_threshold' => ['nullable', 'numeric', 'between:0,1'],
        ];
    }
}
