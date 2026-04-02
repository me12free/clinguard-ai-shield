<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PolicyUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'policy_name' => ['sometimes', 'string', 'max:255'],
            'phi_categories' => ['sometimes', 'array'],
            'phi_categories.*' => ['string', 'max:64'],
            'enforcement_action' => ['sometimes', 'string', 'in:redact,block,warn'],
            'confidence_threshold' => ['sometimes', 'numeric', 'min:0', 'max:1'],
        ];
    }
}
