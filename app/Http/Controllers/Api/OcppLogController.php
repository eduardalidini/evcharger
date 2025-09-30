<?php

namespace App\Http\Controllers\Api;

use App\Events\ChargePointStatusUpdated;
use App\Events\OcppLogCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOcppLogsRequest;
use App\Models\ChargePoint;
use Illuminate\Support\Facades\DB;

class OcppLogController extends Controller
{
    public function store(StoreOcppLogsRequest $request)
    {
        $logs = $request->validated('logs');

        $toInsert = [];
        $chargePointsToBroadcast = [];

        // Aggregate per CP for this batch
        $byCp = [];
        foreach ($logs as $log) {
            $cpId = (string) $log['cpId'];
            $normalizedId = preg_replace('/\\.log$/i', '', $cpId);

            $toInsert[] = [
                'cp_log' => $normalizedId,
                'raw' => $log['raw'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $bucket = $byCp[$normalizedId] ?? [
                'maxConnector' => 0,
                'status' => null,
                'lastHeartbeat' => null,
            ];

            $type = $log['type'] ?? null;
            $event = $log['event'] ?? null;
            $fields = $log['fields'] ?? [];

            // Structured StatusNotification
            if ($type === 'StatusNotification' && is_array($fields)) {
                $cid = (int) ($fields['connectorId'] ?? 0);
                if ($cid > 0 && $cid > $bucket['maxConnector']) {
                    $bucket['maxConnector'] = $cid;
                }
                $mapped = $this->mapStatus((string) ($fields['status'] ?? ''));
                if ($mapped !== null) {
                    $bucket['status'] = $mapped;
                }
            }

            // Heartbeat/connected
            if ($event === 'connected' || $type === 'Heartbeat') {
                $bucket['lastHeartbeat'] = now();
            }

            // Raw fallback: outer JSON log line may include structured keys (type, fields, event)
            if ($type === null && ! empty($log['raw'] ?? null)) {
                $rawLine = (string) $log['raw'];
                $outer = json_decode($rawLine, true);
                if (is_array($outer)) {
                    $outerType = $outer['type'] ?? null;
                    $outerEvent = $outer['event'] ?? null;
                    $outerFields = is_array($outer['fields'] ?? null) ? $outer['fields'] : [];

                    if ($outerType === 'StatusNotification') {
                        $cid = (int) ($outerFields['connectorId'] ?? 0);
                        if ($cid > 0 && $cid > $bucket['maxConnector']) {
                            $bucket['maxConnector'] = $cid;
                        }
                        $mapped = $this->mapStatus((string) ($outerFields['status'] ?? ''));
                        if ($mapped !== null) {
                            $bucket['status'] = $mapped;
                        }
                    }

                    if ($outerEvent === 'connected' || $outerType === 'Heartbeat') {
                        $bucket['lastHeartbeat'] = now();
                    }
                } else {
                    // As a last resort, try to parse embedded OCPP frame text
                    $parsed = $this->parseRaw($rawLine);
                    if ($parsed['type'] === 'StatusNotification') {
                        if ($parsed['connectorId'] > 0 && $parsed['connectorId'] > $bucket['maxConnector']) {
                            $bucket['maxConnector'] = $parsed['connectorId'];
                        }
                        if (! empty($parsed['status'])) {
                            $mapped = $this->mapStatus($parsed['status']);
                            if ($mapped !== null) {
                                $bucket['status'] = $mapped;
                            }
                        }
                    } elseif ($parsed['type'] === 'Heartbeat') {
                        $bucket['lastHeartbeat'] = now();
                    }
                }
            }

            $byCp[$normalizedId] = $bucket;
        }

        DB::table('ocpp_logs')->insert($toInsert);

        $last = end($toInsert);
        event(new OcppLogCreated($last['cp_log'], $last));

        // Apply aggregated updates once per CP
        foreach ($byCp as $identifier => $agg) {
            $cp = ChargePoint::firstOrCreate(
                ['identifier' => $identifier],
                [
                    'name' => $identifier,
                    'status' => 'Unavailable',
                    'connector_count' => max(1, (int) ($agg['maxConnector'] ?? 0)),
                ]
            );

            $dirty = false;
            if (($agg['maxConnector'] ?? 0) > 0 && $cp->connector_count < (int) $agg['maxConnector']) {
                $cp->connector_count = (int) $agg['maxConnector'];
                $dirty = true;
            }
            if (! empty($agg['status']) && $cp->status !== $agg['status']) {
                $cp->status = $agg['status'];
                $dirty = true;
            }
            if (! empty($agg['lastHeartbeat'])) {
                $cp->last_heartbeat = $agg['lastHeartbeat'];
                $dirty = true;
            }

            if ($dirty) {
                $cp->save();
                $chargePointsToBroadcast[$cp->id] = $cp->fresh();
            }
        }

        foreach ($chargePointsToBroadcast as $cp) {
            ChargePointStatusUpdated::dispatch($cp);
        }

        return response()->json(['stored' => count($toInsert)]);
    }

    public function append(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'batches' => ['required', 'array', 'min:1'],
            'batches.*.cpId' => ['required', 'string', 'max:191'],
            'batches.*.lines' => ['required', 'array', 'min:1'],
            'batches.*.lines.*' => ['required', 'string'],
        ]);

        $byCp = [];

        foreach ($validated['batches'] as $batch) {
            $identifier = preg_replace('/\\.log$/i', '', (string) $batch['cpId']);
            foreach ($batch['lines'] as $line) {
                // Try to decode the structured outer log line
                $outer = json_decode($line, true);
                if (is_array($outer)) {
                    $bucket = $byCp[$identifier] ?? [
                        'maxConnector' => 0,
                        'status' => null,
                        'lastHeartbeat' => null,
                    ];

                    $type = $outer['type'] ?? null;
                    $event = $outer['event'] ?? null;
                    $fields = is_array($outer['fields'] ?? null) ? $outer['fields'] : [];

                    if ($type === 'StatusNotification') {
                        $cid = (int) ($fields['connectorId'] ?? 0);
                        if ($cid > 0 && $cid > $bucket['maxConnector']) {
                            $bucket['maxConnector'] = $cid;
                        }
                        $mapped = $this->mapStatus((string) ($fields['status'] ?? ''));
                        if ($mapped !== null) {
                            $bucket['status'] = $mapped;
                        }
                    }
                    if ($event === 'connected' || $type === 'Heartbeat') {
                        $bucket['lastHeartbeat'] = now();
                    }

                    $byCp[$identifier] = $bucket;
                } else {
                    // fallback parser
                    $parsed = $this->parseRaw((string) $line);
                    $bucket = $byCp[$identifier] ?? [
                        'maxConnector' => 0,
                        'status' => null,
                        'lastHeartbeat' => null,
                    ];
                    if ($parsed['type'] === 'StatusNotification') {
                        if ($parsed['connectorId'] > 0 && $parsed['connectorId'] > $bucket['maxConnector']) {
                            $bucket['maxConnector'] = $parsed['connectorId'];
                        }
                        if (! empty($parsed['status'])) {
                            $mapped = $this->mapStatus($parsed['status']);
                            if ($mapped !== null) {
                                $bucket['status'] = $mapped;
                            }
                        }
                    } elseif ($parsed['type'] === 'Heartbeat') {
                        $bucket['lastHeartbeat'] = now();
                    }
                    $byCp[$identifier] = $bucket;
                }
            }
        }

        // Upsert CPs based on aggregation
        foreach ($byCp as $identifier => $agg) {
            $cp = ChargePoint::firstOrCreate(
                ['identifier' => $identifier],
                [
                    'name' => $identifier,
                    'status' => 'Unavailable',
                    'connector_count' => max(1, (int) ($agg['maxConnector'] ?? 0)),
                ]
            );

            $dirty = false;
            if (($agg['maxConnector'] ?? 0) > 0 && $cp->connector_count < (int) $agg['maxConnector']) {
                $cp->connector_count = (int) $agg['maxConnector'];
                $dirty = true;
            }
            if (! empty($agg['status']) && $cp->status !== $agg['status']) {
                $cp->status = $agg['status'];
                $dirty = true;
            }
            if (! empty($agg['lastHeartbeat'])) {
                $cp->last_heartbeat = $agg['lastHeartbeat'];
                $dirty = true;
            }

            if ($dirty) {
                $cp->save();
            }
        }

        return response()->json(['updated' => count($byCp)]);
    }

    private function applyStructuredPayloadToChargePoint(ChargePoint $cp, array $log): void
    {
        $event = $log['event'] ?? null;
        $type = $log['type'] ?? null;
        $fields = $log['fields'] ?? [];

        if ($event === 'connected') {
            $cp->fill(['last_heartbeat' => now()]);
        }

        if ($type === 'StatusNotification') {
            $status = (string) ($fields['status'] ?? '');
            $mapped = match ($status) {
                'Available' => 'Available',
                'Preparing', 'Charging', 'SuspendedEV', 'SuspendedEVSE', 'Finishing', 'Occupied' => 'Occupied',
                'Faulted' => 'Faulted',
                'Unavailable' => 'Unavailable',
                default => null,
            };
            if ($mapped !== null) {
                $cp->status = $mapped;
            }
            $connectorId = (int) ($fields['connectorId'] ?? 0);
            if ($connectorId > 0 && ($cp->connector_count ?? 0) < $connectorId) {
                $cp->connector_count = $connectorId;
            }
        }

        if ($event === 'heartbeat' || ($type === 'Heartbeat')) {
            $cp->last_heartbeat = now();
        }

        if ($cp->isDirty()) {
            $cp->save();
        }
    }

    private function applyRawPayloadToChargePoint(ChargePoint $cp, string $raw): void
    {
        if (str_contains($raw, '"StatusNotification"')) {
            if (preg_match('/,\s*\{(.*)\}\]\s*$/', $raw, $m)) {
                $json = '{'.$m[1].'}';
                $data = json_decode($json, true);
                if (is_array($data)) {
                    $status = (string) ($data['status'] ?? '');
                    $mapped = match ($status) {
                        'Available' => 'Available',
                        'Preparing', 'Charging', 'SuspendedEV', 'SuspendedEVSE', 'Finishing', 'Occupied' => 'Occupied',
                        'Faulted' => 'Faulted',
                        'Unavailable' => 'Unavailable',
                        default => null,
                    };
                    if ($mapped !== null) {
                        $cp->status = $mapped;
                    }
                    $connectorId = (int) ($data['connectorId'] ?? 0);
                    if ($connectorId > 0 && ($cp->connector_count ?? 0) < $connectorId) {
                        $cp->connector_count = $connectorId;
                    }
                }
            }
        } elseif (str_contains($raw, '"Heartbeat"')) {
            $cp->last_heartbeat = now();
        }

        if ($cp->isDirty()) {
            $cp->save();
        }
    }

    private function parseRaw(string $raw): array
    {
        $result = ['type' => null, 'connectorId' => 0, 'status' => null];
        if (str_contains($raw, '"StatusNotification"')) {
            $result['type'] = 'StatusNotification';
            if (preg_match('/,\s*\{(.*)\}\]\s*$/', $raw, $m)) {
                $json = '{'.$m[1].'}';
                $data = json_decode($json, true);
                if (is_array($data)) {
                    $result['connectorId'] = (int) ($data['connectorId'] ?? 0);
                    $result['status'] = isset($data['status']) ? (string) $data['status'] : null;
                }
            }
        } elseif (str_contains($raw, '"Heartbeat"')) {
            $result['type'] = 'Heartbeat';
        }

        return $result;
    }

    private function mapStatus(string $status): ?string
    {
        return match ($status) {
            'Available' => 'Available',
            'Preparing', 'Charging', 'SuspendedEV', 'SuspendedEVSE', 'Finishing', 'Occupied' => 'Occupied',
            'Faulted' => 'Faulted',
            'Unavailable' => 'Unavailable',
            default => null,
        };
    }
}
