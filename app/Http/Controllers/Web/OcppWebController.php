<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class OcppWebController extends Controller
{
    public function start(Request $request, string $identifier)
    {
        $validated = $request->validate([
            'connectorId' => ['nullable','integer'],
            'idTag' => ['nullable','string'],
        ]);

        $bridgeUrl = rtrim(config('services.ocpp_bridge.url', env('OCPP_BRIDGE_URL', 'http://127.0.0.1:8888')), '/');

        $payload = [
            'cpId' => $identifier,
            'idTag' => $validated['idTag'] ?? $identifier,
            'connectorId' => $validated['connectorId'] ?? 1,
        ];

        $resp = Http::withHeaders([
                'X-Node-Connector-Token' => (string) config('services.node_connector.token', env('NODE_CONNECTOR_TOKEN')),
            ])
            ->timeout(15)
            ->acceptJson()
            ->post($bridgeUrl.'/api/ocpp/remote-start', $payload);

        if (!$resp->ok()) {
            return response()->json(['success' => false, 'message' => 'Bridge error', 'status' => $resp->status()], 422);
        }

        return response()->json(['success' => true]);
    }
}


