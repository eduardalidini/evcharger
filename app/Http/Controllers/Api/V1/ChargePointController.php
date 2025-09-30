<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ChargePoint;
use Illuminate\Http\Request;

class ChargePointController extends Controller
{
    public function index(Request $request)
    {
        $query = ChargePoint::query();

        // Optional filters
        if ($request->boolean('connected')) {
            $threshold = now()->subMinutes(5);
            $query->whereNotNull('last_heartbeat')->where('last_heartbeat', '>=', $threshold);
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($identifier = $request->string('identifier')->toString()) {
            $query->where('identifier', 'like', "%{$identifier}%");
        }

        $items = $query->latest()->get()->map(function (ChargePoint $cp) {
            return [
                'id' => $cp->id,
                'identifier' => $cp->identifier,
                'name' => $cp->name,
                'status' => $cp->status,
                'connector_count' => $cp->connector_count,
                'last_heartbeat' => optional($cp->last_heartbeat)->toISOString(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function show(ChargePoint $chargePoint)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $chargePoint->id,
                'identifier' => $chargePoint->identifier,
                'name' => $chargePoint->name,
                'status' => $chargePoint->status,
                'connector_count' => $chargePoint->connector_count,
                'last_heartbeat' => optional($chargePoint->last_heartbeat)->toISOString(),
                'location' => $chargePoint->location,
                'max_power' => $chargePoint->max_power ? (float) $chargePoint->max_power : null,
                'firmware_version' => $chargePoint->firmware_version,
            ],
        ]);
    }
}


