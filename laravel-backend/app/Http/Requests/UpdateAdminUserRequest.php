<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$userId],
            'password' => ['nullable', 'string', Password::defaults()],
            'role_id' => ['sometimes', 'integer', 'exists:roles,id'],
            'organization_id' => ['sometimes', 'integer', 'exists:organizations,id'],
        ];
    }
}
