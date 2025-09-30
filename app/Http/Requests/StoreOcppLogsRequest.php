<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOcppLogsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'logs' => ['required', 'array', 'min:1'],
            'logs.*.cpId' => ['required', 'string', 'max:191'],
            'logs.*.raw' => ['nullable', 'string'],
        ];
    }
}
