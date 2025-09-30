<?php

namespace App\Http\Controllers\Api;

use App\Events\ChargePointStatusUpdated;
use App\Events\OcppStatusPushed;
use App\Http\Controllers\Controller;
use App\Models\ChargePoint;
use Illuminate\Http\Request;

class OcppEventController extends Controller
{
    public function status(Request $request)
    {
        $validated = $request->validate([
            'identifier' => ['required','string'],
            'connectorId' => ['required','integer'],
            'status' => ['required','string'],
            'timestamp' => ['nullable','string'],
        ]);

        $cp = ChargePoint::query()->where('identifier', $validated['identifier'])->first();
        if (!$cp) {
            return response()->json(['success' => false, 'message' => 'Charge point not found'], 404);
        }

        // Map OCPP status to our CP status field when relevant
        // For now, only update when connectorId == 1 to keep it simple
        if ((int)$validated['connectorId'] === 1) {
            $cp->status = $validated['status'] === 'Preparing' ? 'Available' : $validated['status'];
            $cp->last_heartbeat = now();
            $cp->save();
        }

        // Broadcast both: full CP snapshot and the raw OCPP status
        broadcast(new ChargePointStatusUpdated($cp));
        broadcast(new OcppStatusPushed(
            identifier: $validated['identifier'],
            connectorId: (int) $validated['connectorId'],
            status: $validated['status'],
            timestamp: $validated['timestamp'] ?? null,
        ));

        return response()->json(['success' => true]);
    }
}


