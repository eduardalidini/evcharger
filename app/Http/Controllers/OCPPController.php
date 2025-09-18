<?php

namespace App\Http\Controllers;

use App\Models\ChargePoint;
use App\Models\ChargingSession;
use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OCPPController extends Controller
{
    /**
     * Handle OCPP WebSocket messages
     */
    public function handleMessage(Request $request)
    {
        $chargePointId = $request->route('chargePointId');
        $message = $request->all();
        
        Log::info('OCPP Message received', [
            'charge_point' => $chargePointId,
            'message' => $message
        ]);

        // Find charge point
        $chargePoint = ChargePoint::where('identifier', $chargePointId)->first();
        if (!$chargePoint) {
            return response()->json(['error' => 'Charge point not found'], 404);
        }

        // Handle different OCPP message types
        return match($message['action'] ?? null) {
            'BootNotification' => $this->handleBootNotification($chargePoint, $message),
            'Heartbeat' => $this->handleHeartbeat($chargePoint, $message),
            'StatusNotification' => $this->handleStatusNotification($chargePoint, $message),
            'StartTransaction' => $this->handleStartTransaction($chargePoint, $message),
            'StopTransaction' => $this->handleStopTransaction($chargePoint, $message),
            'MeterValues' => $this->handleMeterValues($chargePoint, $message),
            default => $this->handleUnknownMessage($chargePoint, $message)
        };
    }

    /**
     * Handle BootNotification message
     */
    private function handleBootNotification(ChargePoint $chargePoint, array $message): array
    {
        $chargePoint->update([
            'firmware_version' => $message['chargePointVendor'] ?? null,
            'last_heartbeat' => now(),
            'status' => 'Available'
        ]);

        return [
            'currentTime' => now()->toISOString(),
            'interval' => 300, // 5 minutes
            'status' => 'Accepted'
        ];
    }

    /**
     * Handle Heartbeat message
     */
    private function handleHeartbeat(ChargePoint $chargePoint, array $message): array
    {
        $chargePoint->updateHeartbeat();

        return [
            'currentTime' => now()->toISOString()
        ];
    }

    /**
     * Handle StatusNotification message
     */
    private function handleStatusNotification(ChargePoint $chargePoint, array $message): array
    {
        $status = match($message['status'] ?? '') {
            'Available' => 'Available',
            'Occupied' => 'Occupied',
            'Unavailable' => 'Unavailable',
            'Faulted' => 'Faulted',
            default => 'Unavailable'
        };

        $chargePoint->update(['status' => $status]);

        return [];
    }

    /**
     * Handle StartTransaction message
     */
    private function handleStartTransaction(ChargePoint $chargePoint, array $message): array
    {
        // Find existing session or create new one
        $session = ChargingSession::where('charge_point_id', $chargePoint->id)
            ->where('connector_id', $message['connectorId'] ?? 1)
            ->where('id_tag', $message['idTag'] ?? 'unknown')
            ->whereIn('status', ['Starting', 'Active'])
            ->first();

        if (!$session) {
            // This would typically be created by the admin panel
            // For real OCPP, we'd need to validate the idTag and create appropriate session
            return [
                'idTagInfo' => ['status' => 'Invalid'],
                'transactionId' => 0
            ];
        }

        $session->update([
            'status' => 'Active',
            'transaction_id' => $message['transactionId'] ?? rand(1000, 9999),
            'meter_start' => $message['meterStart'] ?? 0,
            'started_at' => now(),
        ]);

        $chargePoint->update(['status' => 'Occupied']);

        // Broadcast session started
        ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));

        return [
            'idTagInfo' => ['status' => 'Accepted'],
            'transactionId' => $session->transaction_id
        ];
    }

    /**
     * Handle StopTransaction message
     */
    private function handleStopTransaction(ChargePoint $chargePoint, array $message): array
    {
        $session = ChargingSession::where('transaction_id', $message['transactionId'] ?? 0)
            ->where('charge_point_id', $chargePoint->id)
            ->first();

        if (!$session) {
            return ['idTagInfo' => ['status' => 'Invalid']];
        }

        // Calculate energy consumed
        $meterStop = $message['meterStop'] ?? $session->meter_start;
        $energyConsumed = ($meterStop - $session->meter_start) / 1000; // Convert Wh to kWh
        $cost = $session->chargingService->calculateCost($energyConsumed);

        $session->update([
            'status' => 'Completed',
            'stopped_at' => now(),
            'meter_stop' => $meterStop,
            'energy_consumed' => $energyConsumed,
            'credits_used' => $cost,
            'stop_reason' => $message['reason'] ?? 'Remote',
        ]);

        // Create transaction record
        $transaction = ChargingTransaction::create([
            'charging_session_id' => $session->id,
            'user_id' => $session->user_id,
            'charging_service_id' => $session->charging_service_id,
            'charge_point_id' => $session->charge_point_id,
            'transaction_reference' => 'TXN-OCPP-' . now()->format('YmdHis') . '-' . \Illuminate\Support\Str::random(4),
            'session_started_at' => $session->started_at,
            'session_stopped_at' => $session->stopped_at,
            'duration_minutes' => abs($session->getDurationInMinutes()),
            'energy_consumed' => abs($energyConsumed),
            'rate_per_kwh' => $session->chargingService->rate_per_kwh,
            'total_amount' => abs($cost),
        ]);

        $chargePoint->update(['status' => 'Available']);

        // Broadcast session stopped
        ChargingSessionStopped::dispatch($session->fresh(), $transaction);

        return ['idTagInfo' => ['status' => 'Accepted']];
    }

    /**
     * Handle MeterValues message
     */
    private function handleMeterValues(ChargePoint $chargePoint, array $message): array
    {
        $session = ChargingSession::where('charge_point_id', $chargePoint->id)
            ->where('connector_id', $message['connectorId'] ?? 1)
            ->active()
            ->first();

        if ($session) {
            // Update energy consumption from meter values
            $meterValues = $message['meterValue'] ?? [];
            if (!empty($meterValues)) {
                $latestMeter = end($meterValues);
                $sampledValues = $latestMeter['sampledValue'] ?? [];
                
                foreach ($sampledValues as $value) {
                    if (($value['measurand'] ?? '') === 'Energy.Active.Import.Register') {
                        $currentMeter = (float) $value['value'];
                        $energyConsumed = ($currentMeter - $session->meter_start) / 1000;
                        
                        $session->update([
                            'energy_consumed' => $energyConsumed,
                            'last_activity' => now(),
                        ]);

                        // Broadcast session update
                        ChargingSessionUpdated::dispatch($session, $meterValues);
                        break;
                    }
                }
            }
        }

        return [];
    }

    /**
     * Handle unknown message types
     */
    private function handleUnknownMessage(ChargePoint $chargePoint, array $message): array
    {
        Log::warning('Unknown OCPP message', [
            'charge_point' => $chargePoint->identifier,
            'message' => $message
        ]);

        return [];
    }
}
