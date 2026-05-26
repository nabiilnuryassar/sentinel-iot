<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AskAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is already auth:sanctum-protected.
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'prompt' => ['required', 'string', 'min:1', 'max:2000'],
            'conversation_id' => ['nullable', 'string', 'max:64'],
        ];
    }
}
