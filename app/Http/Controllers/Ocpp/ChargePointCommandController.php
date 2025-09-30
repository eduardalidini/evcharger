<?php

namespace App\Http\Controllers\Ocpp;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChargePointCommandController extends Controller
{
    public function send(string $chargePointId, Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', 'string'],
            'payload' => ['nullable', 'array'],
        ]);

        $bridgeUrl = rtrim(config('services.ocpp_bridge.url', env('OCPP_BRIDGE_URL', 'http://127.0.0.1:8888')), '/');
        $secret = (string) config('services.ocpp_bridge.secret', env('OCPP_BRIDGE_SECRET'));

        // Handle different OCPP actions
        $endpoint = '';
        $payload = [
            'cpId' => $chargePointId,
        ];

        if ($validated['action'] === 'RemoteStartTransaction') {
            $endpoint = '/api/ocpp/remote-start';
            $payload['idTag'] = $validated['payload']['idTag'] ?? $chargePointId;
            $payload['connectorId'] = $validated['payload']['connectorId'] ?? 1;
        } elseif ($validated['action'] === 'RemoteStopTransaction') {
            $endpoint = '/api/ocpp/remote-stop';
            $payload['transactionId'] = $validated['payload']['transactionId'] ?? null;
            if (!$payload['transactionId']) {
                return response()->json([
                    'success' => false,
                    'message' => 'transactionId is required for RemoteStopTransaction',
                ], 400);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported action: ' . $validated['action'],
            ], 400);
        }

        try {
            $response = Http::withHeaders([
                    'X-Node-Connector-Token' => (string) config('services.node_connector.token', env('NODE_CONNECTOR_TOKEN')),
                ])
                ->timeout(20)
                ->acceptJson()
                ->post($bridgeUrl . $endpoint, $payload);

            if (! $response->ok()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bridge error',
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                ], 422);
            }

            return response()->json($response->json());
        } catch (\Throwable $e) {
            Log::error('OCPP bridge send failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bridge unreachable',
            ], 502);
        }
    }
}

