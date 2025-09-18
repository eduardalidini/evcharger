<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ChargingService;
use App\Models\ChargePoint;
use App\Models\ChargingSession;
use App\Models\ChargingTransaction;
use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use App\Events\ChargePointStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChargingController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        
        // Get available charging services
        $services = ChargingService::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        
        // Get available charge points
        $chargePoints = ChargePoint::where('status', 'Available')
            ->where('is_simulation', true) // Only show simulation for now
            ->get();
        
        // Check for active session
        $activeSession = ChargingSession::where('user_id', $user->id)
            ->whereIn('status', ['Starting', 'Active', 'Paused'])
            ->with(['chargingService', 'chargePoint'])
            ->first();
        
        // Get recent transactions for this user
        $recentTransactions = ChargingTransaction::where('user_id', $user->id)
            ->with(['chargingService', 'chargePoint'])
            ->latest()
            ->limit(10)
            ->get();
        
        return Inertia::render('user/charging/index', [
            'user' => $user,
            'services' => $services,
            'chargePoints' => $chargePoints,
            'activeSession' => $activeSession ? [
                'id' => $activeSession->id,
                'service_name' => $activeSession->chargingService->name,
                'charge_point_name' => $activeSession->chargePoint->name,
                'status' => $activeSession->status,
                'started_at' => $activeSession->started_at?->toISOString(),
                'energy_consumed' => $activeSession->energy_consumed,
                'credits_used' => $activeSession->credits_used,
                'credits_reserved' => $activeSession->credits_reserved,
                'rate_per_kwh' => $activeSession->chargingService->rate_per_kwh,
            ] : null,
            'recentTransactions' => $recentTransactions->map(fn($t) => [
                'id' => $t->id,
                'reference' => $t->transaction_reference,
                'service_name' => $t->chargingService->name,
                'charge_point_name' => $t->chargePoint->name,
                'energy_consumed' => $t->energy_consumed,
                'total_amount' => $t->total_amount,
                'duration_minutes' => $t->duration_minutes,
                'created_at' => $t->created_at->toDateTimeString(),
            ]),
        ]);
    }

    public function start(Request $request)
    {
        $request->validate([
            'charging_service_id' => 'required|exists:charging_services,id',
            'charge_point_id' => 'required|exists:charge_points,id',
            'connector_id' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        
        // Check if user already has an active session
        $existingSession = ChargingSession::where('user_id', $user->id)
            ->whereIn('status', ['Starting', 'Active', 'Paused'])
            ->exists();
            
        if ($existingSession) {
            return back()->withErrors(['error' => 'You already have an active charging session']);
        }
        
        $service = ChargingService::findOrFail($request->charging_service_id);
        $chargePoint = ChargePoint::findOrFail($request->charge_point_id);
        
        // Check if charge point is available
        if ($chargePoint->status !== 'Available') {
            return back()->withErrors(['error' => 'Selected charge point is not available']);
        }
        
        // Check if user has sufficient credits (minimum 10 ALL)
        if ($user->balance < 10) {
            return back()->withErrors(['error' => 'Insufficient credits. Minimum 10 ALL required to start a session']);
        }
        
        DB::transaction(function () use ($user, $service, $chargePoint, $request) {
            // Reserve initial credits (10 ALL)
            $creditsToReserve = 10.0;
            
            // Create charging session
            $session = ChargingSession::create([
                'user_id' => $user->id,
                'charging_service_id' => $service->id,
                'charge_point_id' => $chargePoint->id,
                'connector_id' => $request->connector_id,
                'id_tag' => 'USER_' . $user->id,
                'status' => 'Active',
                'started_at' => now(),
                'last_activity' => now(),
                'credits_reserved' => $creditsToReserve,
                'ocpp_data' => [
                    'meter_start' => 0,
                    'transaction_id' => rand(1000, 9999),
                ]
            ]);
            
            // Update charge point status
            $chargePoint->update(['status' => 'Occupied']);
            
            // Broadcast session started event
            ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));
            
            // Broadcast charge point status update
            ChargePointStatusUpdated::dispatch($chargePoint->fresh());
        });
        
        return redirect()->route('user.charging.index')->with('success', 'Charging session started successfully');
    }

    public function pause(ChargingSession $session)
    {
        $user = Auth::user();
        
        if ($session->user_id !== $user->id) {
            abort(403);
        }
        
        if ($session->status !== 'Active') {
            return back()->withErrors(['error' => 'Session is not active']);
        }
        
        $session->update([
            'status' => 'Paused',
            'last_activity' => now(),
        ]);
        
        ChargingSessionUpdated::dispatch($session->fresh()->load(['chargingService', 'chargePoint']));
        
        return back()->with('success', 'Session paused');
    }

    public function resume(ChargingSession $session)
    {
        $user = Auth::user();
        
        if ($session->user_id !== $user->id) {
            abort(403);
        }
        
        if ($session->status !== 'Paused') {
            return back()->withErrors(['error' => 'Session is not paused']);
        }
        
        // Check if user still has sufficient credits
        if ($user->balance < 5) {
            return back()->withErrors(['error' => 'Insufficient credits to resume session']);
        }
        
        $session->update([
            'status' => 'Active',
            'last_activity' => now(),
        ]);
        
        ChargingSessionUpdated::dispatch($session->fresh()->load(['chargingService', 'chargePoint']));
        
        return back()->with('success', 'Session resumed');
    }

    public function stop(ChargingSession $session)
    {
        $user = Auth::user();
        
        if ($session->user_id !== $user->id) {
            abort(403);
        }
        
        if (!in_array($session->status, ['Active', 'Paused'])) {
            return back()->withErrors(['error' => 'Session cannot be stopped']);
        }
        
        DB::transaction(function () use ($session, $user) {
            // Calculate session duration and energy consumption
            $durationMinutes = abs(now()->diffInMinutes($session->started_at));
            $simulatedConsumption = abs(($durationMinutes / 60) * 10); // 10 kWh per hour simulation
            
            // Calculate cost
            $cost = $simulatedConsumption * $session->chargingService->rate_per_kwh;
            
            // Ensure cost is positive
            $cost = abs($cost);
            
            // Update session
            $session->update([
                'status' => 'Completed',
                'stopped_at' => now(),
                'energy_consumed' => abs($simulatedConsumption),
                'credits_used' => abs($cost),
                'meter_stop' => abs($simulatedConsumption) * 1000, // Convert to Wh
                'stop_reason' => 'User stopped',
            ]);
            
            // Deduct credits from user balance
            $user->decrement('balance', $cost);
            
            // Create transaction record
            $transaction = ChargingTransaction::create([
                'charging_session_id' => $session->id,
                'user_id' => $session->user_id,
                'charging_service_id' => $session->charging_service_id,
                'charge_point_id' => $session->charge_point_id,
                'transaction_reference' => 'TXN-' . now()->format('YmdHis') . '-' . Str::random(4),
                'session_started_at' => $session->started_at,
                'session_stopped_at' => $session->stopped_at,
                'duration_minutes' => abs($durationMinutes),
                'energy_consumed' => abs($simulatedConsumption),
                'rate_per_kwh' => $session->chargingService->rate_per_kwh,
                'total_amount' => abs($cost),
            ]);
            
            // Update charge point status
            $session->chargePoint->update(['status' => 'Available']);
            
            // Broadcast session stopped event
            ChargingSessionStopped::dispatch(
                $session->fresh()->load(['chargingService', 'chargePoint']),
                $transaction
            );
            
            // Broadcast charge point status update
            ChargePointStatusUpdated::dispatch($session->chargePoint->fresh());
        });
        
        return redirect()->route('user.charging.index')->with('success', 'Session stopped. Credits have been deducted from your balance.');
    }

    public function session(ChargingSession $session): Response
    {
        $user = Auth::user();
        
        if ($session->user_id !== $user->id) {
            abort(403);
        }
        
        return Inertia::render('user/charging/session', [
            'session' => [
                'id' => $session->id,
                'service_name' => $session->chargingService->name,
                'charge_point_name' => $session->chargePoint->name,
                'status' => $session->status,
                'started_at' => $session->started_at?->toISOString(),
                'energy_consumed' => $session->energy_consumed,
                'credits_used' => $session->credits_used,
                'credits_reserved' => $session->credits_reserved,
                'rate_per_kwh' => $session->chargingService->rate_per_kwh,
            ],
            'user' => $user,
        ]);
    }
}