<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $currencies = Currency::orderByDesc('is_default')->orderBy('currency_code')
            ->get()
            ->map(function (Currency $currency) {
                return [
                    'id' => $currency->id,
                    'currency_code' => $currency->currency_code,
                    'price_per_kwh' => (float) $currency->price_per_kwh,
                    'tax_percent' => (float) $currency->tax_percent,
                    'is_default' => (bool) $currency->is_default,
                    'created_at' => $currency->created_at,
                    'updated_at' => $currency->updated_at,
                ];
            });

        return Inertia::render('admin/currencies/index', [
            'currencies' => $currencies,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/currencies/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'currency_code' => 'required|string|max:10',
            'price_per_kwh' => 'required|numeric|min:0',
            'tax_percent' => 'required|numeric|min:0|max:100',
            'is_default' => 'nullable',
        ]);

        $data['is_default'] = filter_var($request->boolean('is_default'), FILTER_VALIDATE_BOOLEAN);

        DB::transaction(function () use ($data) {
            if ($data['is_default']) {
                // If setting this currency as default, unset all other defaults
                Currency::where('is_default', true)->update(['is_default' => false]);
            }
            
            Currency::create($data);
        });

        return redirect()->route('admin.currencies.index')->with('success', 'Currency created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Currency $currency)
    {
        return Inertia::render('admin/currencies/edit', [
            'currency' => $currency,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Currency $currency)
    {
        $data = $request->validate([
            'currency_code' => 'required|string|max:10',
            'price_per_kwh' => 'required|numeric|min:0',
            'tax_percent' => 'required|numeric|min:0|max:100',
            'is_default' => 'nullable',
        ]);

        $data['is_default'] = filter_var($request->boolean('is_default'), FILTER_VALIDATE_BOOLEAN);

        DB::transaction(function () use ($data, $currency) {
            if ($data['is_default']) {
                // If setting this currency as default, unset all other defaults
                Currency::where('is_default', true)
                    ->where('id', '!=', $currency->id)
                    ->update(['is_default' => false]);
            }
            
            $currency->update($data);
        });

        return redirect()->route('admin.currencies.index')->with('success', 'Currency updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Currency $currency)
    {
        $currency->delete();
        
        return redirect()->route('admin.currencies.index')->with('success', 'Currency deleted successfully.');
    }

}
