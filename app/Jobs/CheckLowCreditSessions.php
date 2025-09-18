<?php

namespace App\Jobs;

use App\Models\ChargingSession;
use App\Models\ChargingTransaction;
use App\Events\ChargingSessionStopped;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckLowCreditSessions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Get all active sessions where user has insufficient credits
        $sessions = ChargingSession::whereIn('status', ['Active', 'Paused'])
            ->with(['user', 'chargingService', 'chargePoint'])
            ->get()
            ->filter(function ($session) {
                // Calculate current estimated cost
                $durationMinutes = now()->diffInMinutes($session->started_at);
                $simulatedConsumption = ($durationMinutes / 60) * 10; // 10 kWh per hour
                $estimatedCost = $simulatedConsumption * $session->chargingService->rate_per_kwh;
                
                // Check if user has less than 1 ALL or estimated cost exceeds balance
                return $session->user->balance < 1 || $estimatedCost > $session->user->balance;
            });

        foreach ($sessions as $session) {
            $this->stopSessionDueToInsufficientCredits($session);
        }
    }

    private function stopSessionDueToInsufficientCredits(ChargingSession $session): void
    {
        DB::transaction(function () use ($session) {
            $user = $session->user;
            
            // Calculate session duration and energy consumption
            $durationMinutes = abs(now()->diffInMinutes($session->started_at));
            $simulatedConsumption = abs(($durationMinutes / 60) * 10); // 10 kWh per hour simulation
            
            // Calculate cost (but don't exceed user's balance)
            $fullCost = $simulatedConsumption * $session->chargingService->rate_per_kwh;
            $fullCost = abs($fullCost); // Ensure positive
            $actualCost = min($fullCost, $user->balance);
            
            // Update session
            $session->update([
                'status' => 'Completed',
                'stopped_at' => now(),
                'energy_consumed' => abs($simulatedConsumption),
                'credits_used' => abs($actualCost),
                'meter_stop' => abs($simulatedConsumption) * 1000, // Convert to Wh
                'stop_reason' => 'Insufficient credits',
            ]);
            
            // Deduct available credits from user balance
            $user->decrement('balance', $actualCost);
            
            // Create transaction record
            $transaction = ChargingTransaction::create([
                'charging_session_id' => $session->id,
                'user_id' => $session->user_id,
                'charging_service_id' => $session->charging_service_id,
                'charge_point_id' => $session->charge_point_id,
                'transaction_reference' => 'TXN-AUTO-' . now()->format('YmdHis') . '-' . Str::random(4),
                'session_started_at' => $session->started_at,
                'session_stopped_at' => $session->stopped_at,
                'duration_minutes' => abs($durationMinutes),
                'energy_consumed' => abs($simulatedConsumption),
                'rate_per_kwh' => $session->chargingService->rate_per_kwh,
                'total_amount' => abs($actualCost),
                'notes' => 'Session automatically stopped due to insufficient credits',
            ]);
            
            // Update charge point status
            $session->chargePoint->update(['status' => 'Available']);
            
            // Broadcast session stopped event
            ChargingSessionStopped::dispatch(
                $session->fresh()->load(['chargingService', 'chargePoint']),
                $transaction
            );
        });
    }
}