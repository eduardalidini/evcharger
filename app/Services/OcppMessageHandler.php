<?php

namespace App\Services;

use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use App\Models\BusinessUser;
use App\Models\ChargePoint;
use App\Models\ChargingSession;
use App\Models\ChargingTransaction;
use App\Models\IndividualUser;
use Illuminate\Support\Facades\Log;

class OcppMessageHandler
{
    /**
     * Handle a single OCPP action with payload for a given Charge Point.
     */
    public function handle(string $action, ChargePoint $chargePoint, array $payload): array
    {
        return match ($action) {
            'BootNotification' => $this->handleBootNotification($chargePoint, $payload),
            'Heartbeat' => $this->handleHeartbeat($chargePoint, $payload),
            'StatusNotification' => $this->handleStatusNotification($chargePoint, $payload),
            'StartTransaction' => $this->handleStartTransaction($chargePoint, $payload),
            'StopTransaction' => $this->handleStopTransaction($chargePoint, $payload),
            'MeterValues' => $this->handleMeterValues($chargePoint, $payload),
            default => $this->handleUnknownMessage($chargePoint, $payload)
        };
    }

    private function handleBootNotification(ChargePoint $chargePoint, array $message): array
    {
        $chargePoint->update([
            'firmware_version' => $message['firmwareVersion'] ?? ($message['chargePointVendor'] ?? null),
            'last_heartbeat' => now(),
            'status' => 'Available',
        ]);

        return [
            'currentTime' => now()->toISOString(),
            'interval' => 300,
            'status' => 'Accepted',
        ];
    }

    private function handleHeartbeat(ChargePoint $chargePoint, array $message): array
    {
        if (method_exists($chargePoint, 'updateHeartbeat')) {
            $chargePoint->updateHeartbeat();
        } else {
            $chargePoint->update(['last_heartbeat' => now()]);
        }

        return [
            'currentTime' => now()->toISOString(),
        ];
    }

    private function handleStatusNotification(ChargePoint $chargePoint, array $message): array
    {
        $status = match ($message['status'] ?? '') {
            'Available' => 'Available',
            'Occupied' => 'Occupied',
            'Unavailable' => 'Unavailable',
            'Faulted' => 'Faulted',
            default => 'Unavailable'
        };

        $chargePoint->update(['status' => $status]);

        return [];
    }

    private function handleStartTransaction(ChargePoint $chargePoint, array $message): array
    {
        $connectorId = (int) ($message['connectorId'] ?? 1);
        $idTag = (string) ($message['idTag'] ?? 'unknown');
        $transactionId = (int) ($message['transactionId'] ?? random_int(1000, 999999));
        $meterStart = (float) ($message['meterStart'] ?? 0);

        $session = ChargingSession::where('charge_point_id', $chargePoint->id)
            ->where('connector_id', $connectorId)
            ->where('id_tag', $idTag)
            ->whereIn('status', ['Starting', 'Active'])
            ->first();

        // If no pending session exists, create one on-the-fly BUT only if a user can be resolved
        if (! $session) {
            $resolvedUser = $this->resolveUserFromIdTag($idTag);
            if ($resolvedUser === null) {
                return [
                    'idTagInfo' => ['status' => 'Invalid'],
                    'transactionId' => 0,
                ];
            }

            // Pick a default charging service (required by schema)
            $serviceId = optional(\App\Models\ChargingService::active()->ordered()->first())->id
                ?? optional(\App\Models\ChargingService::query()->first())->id
                ?? null;

            if ($serviceId === null) {
                // No available service → reject
                return [
                    'idTagInfo' => ['status' => 'Invalid'],
                    'transactionId' => 0,
                ];
            }

            $session = ChargingSession::create([
                'user_id' => $resolvedUser['id'],
                'charging_service_id' => $serviceId,
                'charge_point_id' => $chargePoint->id,
                'connector_id' => $connectorId,
                'id_tag' => $idTag,
                'transaction_id' => $transactionId,
                'status' => 'Active',
                'started_at' => now(),
                'last_activity' => now(),
                'meter_start' => $meterStart,
                'ocpp_data' => [
                    'start_initiator' => 'remote',
                    'user_type' => $resolvedUser['type'],
                ],
            ]);
        } else {
            $session->update([
                'status' => 'Active',
                'transaction_id' => $transactionId,
                'meter_start' => $meterStart,
                'started_at' => now(),
            ]);
        }

        $chargePoint->update(['status' => 'Occupied']);

        ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));

        return [
            'idTagInfo' => ['status' => 'Accepted'],
            'transactionId' => $session->transaction_id,
        ];
    }

    /**
     * Resolve user from idTag string.
     * Supported patterns:
     * - U-<id> → IndividualUser by primary key
     * - B-<id> → BusinessUser by primary key
     * - Else try match Individual by id_number, then Business by nipt, then by email for both.
     */
    private function resolveUserFromIdTag(string $idTag): ?array
    {
        if (preg_match('/^U-(\d+)$/', $idTag, $m)) {
            $u = IndividualUser::find((int) $m[1]);
            if ($u) {
                return ['id' => $u->id, 'type' => 'individual'];
            }
        }
        if (preg_match('/^B-(\d+)$/', $idTag, $m)) {
            $b = BusinessUser::find((int) $m[1]);
            if ($b) {
                return ['id' => $b->id, 'type' => 'business'];
            }
        }

        // Try Individual by id_number then email
        $u = IndividualUser::where('id_number', $idTag)->first()
            ?: IndividualUser::where('email', $idTag)->first();
        if ($u) {
            return ['id' => $u->id, 'type' => 'individual'];
        }

        // Try Business by nipt, then email
        $b = BusinessUser::where('nipt', $idTag)->first()
            ?: BusinessUser::where('email', $idTag)->first();
        if ($b) {
            return ['id' => $b->id, 'type' => 'business'];
        }

        return null;
    }

    private function handleStopTransaction(ChargePoint $chargePoint, array $message): array
    {
        $session = ChargingSession::where('transaction_id', $message['transactionId'] ?? 0)
            ->where('charge_point_id', $chargePoint->id)
            ->first();

        if (! $session) {
            return ['idTagInfo' => ['status' => 'Invalid']];
        }

        $meterStop = $message['meterStop'] ?? $session->meter_start;
        $energyConsumed = ($meterStop - $session->meter_start) / 1000;
        $cost = $session->chargingService->calculateCost($energyConsumed);

        $session->update([
            'status' => 'Completed',
            'stopped_at' => now(),
            'meter_stop' => $meterStop,
            'energy_consumed' => $energyConsumed,
            'credits_used' => $cost,
            'stop_reason' => $message['reason'] ?? 'Remote',
        ]);

        $transaction = ChargingTransaction::create([
            'charging_session_id' => $session->id,
            'user_id' => $session->user_id,
            'charging_service_id' => $session->charging_service_id,
            'charge_point_id' => $session->charge_point_id,
            'transaction_reference' => 'TXN-OCPP-'.now()->format('YmdHis').'-'.\Illuminate\Support\Str::random(4),
            'session_started_at' => $session->started_at,
            'session_stopped_at' => $session->stopped_at,
            'duration_minutes' => abs($session->getDurationInMinutes()),
            'energy_consumed' => abs($energyConsumed),
            'rate_per_kwh' => $session->chargingService->rate_per_kwh,
            'total_amount' => abs($cost),
        ]);

        $chargePoint->update(['status' => 'Available']);

        ChargingSessionStopped::dispatch($session->fresh(), $transaction);

        return ['idTagInfo' => ['status' => 'Accepted']];
    }

    private function handleMeterValues(ChargePoint $chargePoint, array $message): array
    {
        $session = ChargingSession::where('charge_point_id', $chargePoint->id)
            ->where('connector_id', $message['connectorId'] ?? 1)
            ->active()
            ->first();

        if ($session) {
            $meterValues = $message['meterValue'] ?? [];
            if (! empty($meterValues)) {
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

                        ChargingSessionUpdated::dispatch($session, $meterValues);
                        break;
                    }
                }
            }
        }

        return [];
    }

    private function handleUnknownMessage(ChargePoint $chargePoint, array $message): array
    {
        Log::warning('Unknown OCPP message', [
            'charge_point' => $chargePoint->identifier,
            'message' => $message,
        ]);

        return [];
    }
}
