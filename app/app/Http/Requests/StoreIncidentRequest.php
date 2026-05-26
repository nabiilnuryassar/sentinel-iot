<?php

namespace App\Http\Requests;

use App\Models\Incident;
use Illuminate\Foundation\Http\FormRequest;

class StoreIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'severity' => ['required', 'string', 'in:'.implode(',', [
                Incident::SEVERITY_LOW,
                Incident::SEVERITY_MEDIUM,
                Incident::SEVERITY_HIGH,
                Incident::SEVERITY_CRITICAL,
            ])],
            'affected_device_id' => ['nullable', 'string', 'max:120', 'exists:devices,device_id'],
            'summary' => ['nullable', 'string'],
        ];
    }
}
