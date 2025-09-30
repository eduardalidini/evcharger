<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChargePoint;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChargePointController extends Controller
{
    public function index(): Response
    {
        $chargePoints = ChargePoint::query()->latest()->get()->map(function ($cp) {
            return [
                'id' => $cp->id,
                'identifier' => $cp->identifier,
                'name' => $cp->name,
                'location' => $cp->location,
                'status' => $cp->status,
                'connector_count' => $cp->connector_count,
                'max_power' => (float) $cp->max_power,
            ];
        });

        return Inertia::render('admin/charge-points/index', [
            'chargePoints' => $chargePoints,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'identifier' => 'required|string|max:255|unique:charge_points,identifier',
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'connector_count' => 'required|integer|min:1',
            'max_power' => 'nullable|numeric|min:0',
        ]);

        $validated['status'] = 'Available';

        ChargePoint::create($validated);

        return back()->with('success', 'Charge point created successfully');
    }

    public function update(Request $request, ChargePoint $chargePoint)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'connector_count' => 'required|integer|min:1',
            'max_power' => 'nullable|numeric|min:0',
        ]);

        $chargePoint->update($validated);

        return back()->with('success', 'Charge point updated successfully');
    }

    public function destroy(ChargePoint $chargePoint)
    {
        // Optional: prevent deletion if active sessions exist
        $chargePoint->delete();

        return back()->with('success', 'Charge point deleted successfully');
    }
}
