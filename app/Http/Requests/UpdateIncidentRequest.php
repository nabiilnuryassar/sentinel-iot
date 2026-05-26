<?php

namespace App\Http\Requests;

use App\Models\Incident;
use Illuminate\Foundation\Http\FormRequest;

class UpdateIncidentRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'severity' => ['sometimes', 'required', 'string', 'in:'.implode(',', [
                Incident::SEVERITY_LOW,
                Incident::SEVERITY_MEDIUM,
                Incident::SEVERITY_HIGH,
                Incident::SEVERITY_CRITICAL,
            ])],
            'status' => ['sometimes', 'required', 'string', 'in:'.implode(',', [
                Incident::STATUS_OPEN,
                Incident::STATUS_INVESTIGATING,
                Incident::STATUS_MITIGATED,
                Incident::STATUS_CLOSED,
            ])],
            'affected_device_id' => ['nullable', 'string', 'max:120', 'exists:devices,device_id'],
            'summary' => ['nullable', 'string'],
            'root_cause' => ['nullable', 'string'],
            'recommendation' => ['nullable', 'string'],
        ];
    }
}
