<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use React\EventLoop\Loop;
use React\Socket\SocketServer;
use React\Stream\WritableResourceStream;
use App\Models\ChargePoint;
use App\Models\ChargingSession;
use App\Events\ChargePointStatusUpdated;
use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use Illuminate\Support\Facades\Log;

class OcppWebSocketServer extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ocpp:websocket-server {--port=8081}';

    /**
     * The console command description.
     */
    protected $description = 'Start OCPP WebSocket server for charge point communication';

    protected $connections = [];
    protected $chargePoints = [];
    protected $activeSessions = [];
    protected $liveUpdateTimer;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $port = $this->option('port');
        
        $this->info("Starting OCPP WebSocket server on port {$port}...");
        
        $loop = Loop::get();
        $socket = new SocketServer("0.0.0.0:{$port}", [], $loop);
        
        $socket->on('connection', function ($connection) {
            $this->info("New OCPP connection from {$connection->getRemoteAddress()}");
            
            $connection->on('data', function ($data) use ($connection) {
                $this->handleWebSocketData($connection, $data);
            });
            
            $connection->on('close', function () use ($connection) {
                $this->info("OCPP connection closed");
                $this->removeConnection($connection);
            });
            
            $this->connections[] = $connection;
        });
        
        $this->info("OCPP WebSocket server running on ws://localhost:{$port}");
        $this->info("Charge points can connect using OCPP 1.6 JSON protocol");
        $this->info("🚀 LIVE session updates enabled - broadcasting instant updates!");
        $this->info("Use Ctrl+C to stop the server");
        
        // Start the live session update timer (every 1 second for smooth real-time feel)
        $this->startLiveSessionUpdates($loop);
        
        $loop->run();
    }

    protected function handleWebSocketData($connection, $data)
    {
        // Basic WebSocket frame parsing (simplified)
        if (!$this->isWebSocketHandshake($data)) {
            $payload = $this->extractWebSocketPayload($data);
            if ($payload) {
                $this->handleOcppMessage($connection, $payload);
            }
        } else {
            $this->handleWebSocketHandshake($connection, $data);
        }
    }

    protected function isWebSocketHandshake($data)
    {
        return strpos($data, 'Upgrade: websocket') !== false;
    }

    protected function handleWebSocketHandshake($connection, $data)
    {
        // Extract WebSocket key
        preg_match('/Sec-WebSocket-Key: (.+)/', $data, $matches);
        if (!isset($matches[1])) {
            $connection->close();
            return;
        }
        
        $key = trim($matches[1]);
        $acceptKey = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        
        // Send WebSocket handshake response
        $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                   "Upgrade: websocket\r\n" .
                   "Connection: Upgrade\r\n" .
                   "Sec-WebSocket-Accept: {$acceptKey}\r\n" .
                   "Sec-WebSocket-Protocol: ocpp1.6\r\n\r\n";
        
        $connection->write($response);
        $this->info("WebSocket handshake completed");
    }

    protected function extractWebSocketPayload($data)
    {
        if (strlen($data) < 2) return null;
        
        $firstByte = ord($data[0]);
        $secondByte = ord($data[1]);
        
        $masked = ($secondByte & 0x80) === 0x80;
        $payloadLength = $secondByte & 0x7F;
        
        if ($payloadLength === 126) {
            $payloadLength = unpack('n', substr($data, 2, 2))[1];
            $maskStart = 4;
        } elseif ($payloadLength === 127) {
            $payloadLength = unpack('J', substr($data, 2, 8))[1];
            $maskStart = 10;
        } else {
            $maskStart = 2;
        }
        
        if ($masked) {
            $mask = substr($data, $maskStart, 4);
            $payload = substr($data, $maskStart + 4, $payloadLength);
            
            // Unmask payload
            for ($i = 0; $i < strlen($payload); $i++) {
                $payload[$i] = $payload[$i] ^ $mask[$i % 4];
            }
        } else {
            $payload = substr($data, $maskStart, $payloadLength);
        }
        
        return $payload;
    }

    protected function handleOcppMessage($connection, $message)
    {
        try {
            $data = json_decode($message, true);
            
            if (!$data || !is_array($data) || count($data) < 3) {
                Log::warning("Invalid OCPP message format", ['message' => $message]);
                return;
            }

            $messageType = $data[0];
            $messageId = $data[1];
            
            switch ($messageType) {
                case 2: // CALL
                    $action = $data[2];
                    $payload = $data[3] ?? [];
                    $this->handleCall($connection, $messageId, $action, $payload);
                    break;
            }
        } catch (\Exception $e) {
            Log::error("Error processing OCPP message", [
                'error' => $e->getMessage(),
                'message' => $message
            ]);
        }
    }

    protected function handleCall($connection, $messageId, $action, $payload)
    {
        $this->info("OCPP CALL: {$action}");
        
        switch ($action) {
            case 'BootNotification':
                $this->handleBootNotification($connection, $messageId, $payload);
                break;
                
            case 'Heartbeat':
                $this->handleHeartbeat($connection, $messageId);
                break;
                
            case 'StatusNotification':
                $this->handleStatusNotification($connection, $messageId, $payload);
                break;
                
            case 'StartTransaction':
                $this->handleStartTransaction($connection, $messageId, $payload);
                break;
                
            case 'StopTransaction':
                $this->handleStopTransaction($connection, $messageId, $payload);
                break;
                
            case 'MeterValues':
                $this->handleMeterValues($connection, $messageId, $payload);
                break;
                
            default:
                $this->sendCallError($connection, $messageId, 'NotSupported', "Action {$action} not supported");
        }
    }

    protected function handleBootNotification($connection, $messageId, $payload)
    {
        $chargePointId = $payload['chargePointVendor'] . '_' . $payload['chargePointSerialNumber'];
        
        // Store charge point connection
        $this->chargePoints[$chargePointId] = $connection;
        $connection->chargePointId = $chargePointId;
        
        // Update or create charge point in database
        $chargePoint = ChargePoint::firstOrCreate(
            ['identifier' => $chargePointId],
            [
                'name' => $payload['chargePointModel'] ?? 'Unknown Model',
                'location' => 'Auto-discovered',
                'status' => 'Available',
                'connector_count' => 1,
                'max_power' => 22.0,
                'is_simulation' => false
            ]
        );

        // Send response
        $response = [3, $messageId, [
            'status' => 'Accepted',
            'currentTime' => now()->toISOString(),
            'interval' => 300
        ]];
        
        $this->sendWebSocketMessage($connection, json_encode($response));
        
        // Broadcast status update
        ChargePointStatusUpdated::dispatch($chargePoint);
        
        $this->info("Charge point registered: {$chargePointId}");
    }

    protected function handleHeartbeat($connection, $messageId)
    {
        $response = [3, $messageId, [
            'currentTime' => now()->toISOString()
        ]];
        
        $this->sendWebSocketMessage($connection, json_encode($response));
    }

    protected function handleStatusNotification($connection, $messageId, $payload)
    {
        $connectorId = $payload['connectorId'];
        $status = $payload['status'];
        
        if (isset($connection->chargePointId)) {
            $chargePoint = ChargePoint::where('identifier', $connection->chargePointId)->first();
            
            if ($chargePoint) {
                $internalStatus = $this->mapOcppStatus($status);
                $chargePoint->update(['status' => $internalStatus]);
                
                ChargePointStatusUpdated::dispatch($chargePoint);
            }
        }
        
        $response = [3, $messageId, []];
        $this->sendWebSocketMessage($connection, json_encode($response));
        
        $this->info("Status notification: {$status}");
    }

    protected function handleStartTransaction($connection, $messageId, $payload)
    {
        $connectorId = $payload['connectorId'] ?? 1;
        $idTag = $payload['idTag'] ?? 'UNKNOWN';
        $meterStart = $payload['meterStart'] ?? 0;
        $timestamp = $payload['timestamp'] ?? now()->toISOString();
        
        $transactionId = rand(1000, 9999);
        
        if (isset($connection->chargePointId)) {
            $chargePoint = ChargePoint::where('identifier', $connection->chargePointId)->first();
            
            if ($chargePoint) {
                try {
                    // Find an active session for this charge point and connector
                    $session = ChargingSession::where('charge_point_id', $chargePoint->id)
                        ->where('connector_id', $connectorId)
                        ->whereIn('status', ['Active', 'Starting'])
                        ->first();
                    
                    if ($session) {
                        // Update session with OCPP transaction data
                        $session->update([
                            'transaction_id' => $transactionId,
                            'meter_start' => $meterStart,
                            'status' => 'Active',
                            'last_activity' => now(),
                            'ocpp_data' => array_merge($session->ocpp_data ?? [], [
                                'start_transaction' => [
                                    'timestamp' => $timestamp,
                                    'meter_start' => $meterStart,
                                    'id_tag' => $idTag,
                                    'connector_id' => $connectorId
                                ]
                            ])
                        ]);
                        
                        // Broadcast session started event if it was just starting
                        ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));
                        
                        $this->info("OCPP transaction {$transactionId} linked to session {$session->id}");
                    } else {
                        $this->info("No matching session found for transaction start");
                    }
                    
                } catch (\Exception $e) {
                    Log::error("Error handling start transaction", [
                        'error' => $e->getMessage(),
                        'charge_point' => $connection->chargePointId
                    ]);
                }
            }
        }
        
        $response = [3, $messageId, [
            'transactionId' => $transactionId
        ]];
        
        $this->sendWebSocketMessage($connection, json_encode($response));
        $this->info("OCPP transaction started: {$transactionId}");
    }

    protected function handleStopTransaction($connection, $messageId, $payload)
    {
        $transactionId = $payload['transactionId'] ?? null;
        $meterStop = $payload['meterStop'] ?? 0;
        $timestamp = $payload['timestamp'] ?? now()->toISOString();
        $reason = $payload['reason'] ?? 'Local';
        
        if (isset($connection->chargePointId) && $transactionId) {
            $chargePoint = ChargePoint::where('identifier', $connection->chargePointId)->first();
            
            if ($chargePoint) {
                try {
                    // Find the session with this transaction ID
                    $session = ChargingSession::where('charge_point_id', $chargePoint->id)
                        ->where('transaction_id', $transactionId)
                        ->whereIn('status', ['Active', 'Paused'])
                        ->first();
                    
                    if ($session) {
                        // Calculate energy consumed
                        $energyConsumed = max(0, ($meterStop - $session->meter_start) / 1000); // Convert Wh to kWh
                        
                        // Calculate final cost
                        $finalCost = $energyConsumed * $session->chargingService->rate_per_kwh;
                        $finalCost = min($finalCost, $session->credits_reserved); // Don't exceed reserved credits
                        
                        // Update session
                        $session->update([
                            'status' => 'Completed',
                            'stopped_at' => now(),
                            'meter_stop' => $meterStop,
                            'energy_consumed' => round($energyConsumed, 3),
                            'credits_used' => round($finalCost, 2),
                            'stop_reason' => $reason,
                            'last_activity' => now(),
                            'ocpp_data' => array_merge($session->ocpp_data ?? [], [
                                'stop_transaction' => [
                                    'timestamp' => $timestamp,
                                    'meter_stop' => $meterStop,
                                    'reason' => $reason
                                ]
                            ])
                        ]);
                        
                        // Update charge point status
                        $chargePoint->update(['status' => 'Available']);
                        
                        // Create transaction record (simplified - you may want to improve this)
                        $transaction = \App\Models\ChargingTransaction::create([
                            'charging_session_id' => $session->id,
                            'user_id' => $session->user_id,
                            'charging_service_id' => $session->charging_service_id,
                            'charge_point_id' => $session->charge_point_id,
                            'transaction_reference' => 'TXN-OCPP-' . $transactionId,
                            'session_started_at' => $session->started_at,
                            'session_stopped_at' => $session->stopped_at,
                            'duration_minutes' => $session->getDurationInMinutes(),
                            'energy_consumed' => $energyConsumed,
                            'rate_per_kwh' => $session->chargingService->rate_per_kwh,
                            'total_amount' => $finalCost,
                            'notes' => "OCPP Stop Reason: {$reason}",
                        ]);
                        
                        // Deduct credits from user
                        $user = $session->user();
                        if ($user) {
                            $user->decrement('balance', $finalCost);
                        }
                        
                        // Broadcast session stopped event
                        \App\Events\ChargingSessionStopped::dispatch(
                            $session->fresh(['chargingService', 'chargePoint']),
                            $transaction
                        );
                        
                        $this->info("OCPP transaction {$transactionId} completed for session {$session->id}");
                    } else {
                        $this->info("No matching session found for transaction {$transactionId}");
                    }
                    
                } catch (\Exception $e) {
                    Log::error("Error handling stop transaction", [
                        'error' => $e->getMessage(),
                        'transaction_id' => $transactionId,
                        'charge_point' => $connection->chargePointId
                    ]);
                }
            }
        }
        
        $response = [3, $messageId, []];
        $this->sendWebSocketMessage($connection, json_encode($response));
        $this->info("OCPP transaction stopped: {$transactionId}");
    }

    protected function handleMeterValues($connection, $messageId, $payload)
    {
        $connectorId = $payload['connectorId'] ?? 1;
        $transactionId = $payload['transactionId'] ?? null;
        $meterValues = $payload['meterValue'] ?? [];

        if (isset($connection->chargePointId) && $transactionId) {
            $chargePoint = ChargePoint::where('identifier', $connection->chargePointId)->first();
            
            if ($chargePoint) {
                try {
                    // Find the session with this transaction ID
                    $session = ChargingSession::where('charge_point_id', $chargePoint->id)
                        ->where('transaction_id', $transactionId)
                        ->where('status', 'Active')
                        ->first();
                    
                    if ($session) {
                        // Process meter values and update session
                        $energyValue = null;
                        $powerValue = null;
                        
                        foreach ($meterValues as $meterValue) {
                            $sampledValues = $meterValue['sampledValue'] ?? [];
                            
                            foreach ($sampledValues as $sample) {
                                $measurand = $sample['measurand'] ?? '';
                                $value = floatval($sample['value'] ?? 0);
                                
                                switch ($measurand) {
                                    case 'Energy.Active.Import.Register':
                                        $energyValue = $value / 1000; // Convert Wh to kWh
                                        break;
                                    case 'Power.Active.Import':
                                        $powerValue = $value / 1000; // Convert W to kW
                                        break;
                                }
                            }
                        }
                        
                        // Calculate energy consumed if we have the energy value
                        if ($energyValue !== null && $session->meter_start) {
                            $energyConsumed = max(0, $energyValue - ($session->meter_start / 1000));
                            $creditsUsed = $energyConsumed * $session->chargingService->rate_per_kwh;
                            $creditsUsed = min($creditsUsed, $session->credits_reserved);
                            
                            // Update session with current values
                            $session->update([
                                'energy_consumed' => round($energyConsumed, 3),
                                'credits_used' => round($creditsUsed, 2),
                                'last_activity' => now(),
                            ]);
                            
                            // Broadcast live update
                            \App\Events\ChargingSessionUpdated::dispatch(
                                $session->fresh(['chargingService', 'chargePoint']),
                                $meterValues
                            );
                            
                            $this->info("Updated session {$session->id} with meter values - Energy: {$energyConsumed} kWh");
                        }
                    }
                    
                } catch (\Exception $e) {
                    Log::error("Error handling meter values", [
                        'error' => $e->getMessage(),
                        'transaction_id' => $transactionId,
                        'charge_point' => $connection->chargePointId
                    ]);
                }
            }
        }
        
        // Send acknowledgment
        $response = [3, $messageId, []];
        $this->sendWebSocketMessage($connection, json_encode($response));
        
        $this->info("Meter values processed for transaction: {$transactionId}");
    }

    /**
     * Start live session updates using WebSocket event loop
     */
    protected function startLiveSessionUpdates($loop)
    {
        $this->liveUpdateTimer = $loop->addPeriodicTimer(1.0, function () {
            try {
                $this->updateActiveSessionsLive();
            } catch (\Exception $e) {
                Log::error("Live session update error", ['error' => $e->getMessage()]);
            }
        });
    }

    /**
     * Update active sessions and broadcast instantly
     */
    protected function updateActiveSessionsLive()
    {
        $activeSessions = ChargingSession::whereIn('status', ['Active', 'Paused'])
            ->with(['chargingService', 'chargePoint'])
            ->get();

        foreach ($activeSessions as $session) {
            try {
                // Only update if session has been active for more than 5 seconds (prevent spam on start)
                if ($session->started_at->diffInSeconds(now()) < 5) {
                    continue;
                }

                // Calculate real-time progress
                $durationMinutes = $session->getDurationInMinutes();
                
                // Simulate realistic energy consumption (varies between 8-12 kW)
                $basepower = 10; // kW
                $variation = sin(time() / 10) * 2; // Creates realistic power variation
                $currentPower = $basepower + $variation;
                $energyConsumed = ($durationMinutes / 60) * $currentPower;
                
                // Calculate credits in real-time
                $creditsUsed = $energyConsumed * $session->chargingService->rate_per_kwh;
                $creditsUsed = min($creditsUsed, $session->credits_reserved);
                
                // Only update if values changed significantly (avoid unnecessary broadcasts)
                $oldEnergy = floatval($session->energy_consumed);
                $newEnergy = round($energyConsumed, 3);
                
                if (abs($newEnergy - $oldEnergy) >= 0.001) { // Update if changed by at least 0.001 kWh
                    // Update session instantly
                    $session->update([
                        'energy_consumed' => $newEnergy,
                        'credits_used' => round($creditsUsed, 2),
                        'last_activity' => now(),
                    ]);

                    // Create realistic meter values for the broadcast
                    $meterValues = [
                        'timestamp' => now()->toISOString(),
                        'meter_value' => [
                            'energy_active_import_register' => [
                                'value' => (string) round($energyConsumed * 1000, 0), // Wh
                                'unit' => 'Wh',
                                'measurand' => 'Energy.Active.Import.Register'
                            ],
                            'power_active_import' => [
                                'value' => (string) round($currentPower * 1000, 0), // W
                                'unit' => 'W',
                                'measurand' => 'Power.Active.Import'
                            ],
                            'current_import' => [
                                'value' => (string) round($currentPower * 1000 / 230, 1), // A
                                'unit' => 'A',
                                'measurand' => 'Current.Import'
                            ],
                            'voltage' => [
                                'value' => (string) (230 + rand(-5, 5)), // Realistic voltage variation
                                'unit' => 'V',
                                'measurand' => 'Voltage'
                            ]
                        ]
                    ];

                    // Broadcast INSTANT update
                    ChargingSessionUpdated::dispatch(
                        $session->fresh(['chargingService', 'chargePoint']),
                        $meterValues
                    );
                    
                    $this->info("⚡ LIVE update: Session {$session->id} - {$newEnergy} kWh - {$currentPower} kW");
                }
                
            } catch (\Exception $e) {
                Log::error("Failed to update session live", [
                    'session_id' => $session->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    protected function sendCallError($connection, $messageId, $errorCode, $description)
    {
        $response = [4, $messageId, $errorCode, $description, []];
        $this->sendWebSocketMessage($connection, json_encode($response));
    }

    protected function sendWebSocketMessage($connection, $message)
    {
        $frame = $this->createWebSocketFrame($message);
        $connection->write($frame);
    }

    protected function createWebSocketFrame($payload)
    {
        $payloadLength = strlen($payload);
        
        if ($payloadLength < 126) {
            $frame = chr(0x81) . chr($payloadLength);
        } elseif ($payloadLength < 65536) {
            $frame = chr(0x81) . chr(126) . pack('n', $payloadLength);
        } else {
            $frame = chr(0x81) . chr(127) . pack('J', $payloadLength);
        }
        
        return $frame . $payload;
    }

    protected function mapOcppStatus($ocppStatus)
    {
        $statusMap = [
            'Available' => 'Available',
            'Occupied' => 'Occupied',
            'Reserved' => 'Reserved',
            'Unavailable' => 'Unavailable',
            'Faulted' => 'Faulted',
        ];
        
        return $statusMap[$ocppStatus] ?? 'Unknown';
    }

    protected function removeConnection($connection)
    {
        if (isset($connection->chargePointId)) {
            unset($this->chargePoints[$connection->chargePointId]);
        }
        
        $key = array_search($connection, $this->connections);
        if ($key !== false) {
            unset($this->connections[$key]);
        }
    }

    /**
     * Cleanup on server shutdown
     */
    public function __destruct()
    {
        if ($this->liveUpdateTimer) {
            $this->liveUpdateTimer->cancel();
        }
    }
}
