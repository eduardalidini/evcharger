<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChargingService;
use App\Models\ChargePoint;
use App\Models\ChargingSession;
use App\Models\ChargingTransaction;
use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use App\Events\ChargePointStatusUpdated;
use App\Events\AdminChargingServiceUpdated;
use App\Events\AdminChargePointManaged;
use App\Events\AdminSessionForceStop;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display services and active sessions dashboard.
     */
    public function index(): Response
    {
        $services = ChargingService::ordered()->get()->map(function ($service) {
            return [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'rate_per_kwh' => (float) $service->rate_per_kwh,
                'currency' => $service->currency,
                'is_active' => $service->is_active,
                'sort_order' => $service->sort_order,
            ];
        });
        
        $chargePoints = ChargePoint::with(['chargingSessions' => function($query) {
            $query->active()->with(['chargingService', 'chargePoint']);
        }])->get()->map(function ($chargePoint) {
            return [
                'id' => $chargePoint->id,
                'identifier' => $chargePoint->identifier,
                'name' => $chargePoint->name,
                'location' => $chargePoint->location,
                'status' => $chargePoint->status,
                'connector_count' => $chargePoint->connector_count,
                'max_power' => (float) $chargePoint->max_power,
                'is_simulation' => $chargePoint->is_simulation,
            ];
        });

        $activeSessions = ChargingSession::active()
            ->with(['chargingService', 'chargePoint'])
            ->latest('started_at')
            ->get()
            ->map(function ($session) {
                $user = $session->user();
                return [
                    'id' => $session->id,
                    'user_name' => $user ? $user->name . ' ' . $user->surname : 'Unknown',
                    'user_id' => $session->user_id,
                    'service_name' => $session->chargingService->name,
                    'charge_point_name' => $session->chargePoint->name,
                    'connector_id' => $session->connector_id,
                    'status' => $session->status,
                    'started_at' => $session->started_at,
                    'duration_minutes' => $session->getDurationInMinutes(),
                    'energy_consumed' => (float) $session->energy_consumed,
                    'credits_reserved' => (float) $session->credits_reserved,
                    'credits_used' => (float) $session->credits_used,
                ];
            });

        $recentTransactions = ChargingTransaction::with(['chargingService', 'chargePoint'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                $user = $transaction->user();
                return [
                    'id' => $transaction->id,
                    'transaction_reference' => $transaction->transaction_reference,
                    'user_name' => $user ? $user->name . ' ' . $user->surname : 'Unknown',
                    'service_name' => $transaction->chargingService->name,
                    'charge_point_name' => $transaction->chargePoint->name,
                    'energy_consumed' => (float) $transaction->energy_consumed,
                    'total_amount' => (float) $transaction->total_amount,
                    'duration_minutes' => $transaction->duration_minutes,
                    'session_started_at' => $transaction->session_started_at,
                    'created_at' => $transaction->created_at,
                ];
            });

        return Inertia::render('admin/services/index', [
            'services' => $services,
            'chargePoints' => $chargePoints,
            'activeSessions' => $activeSessions,
            'recentTransactions' => $recentTransactions,
            'stats' => [
                'total_services' => $services->count(),
                'active_sessions' => $activeSessions->count(),
                'available_charge_points' => $chargePoints->where('status', 'Available')->count(),
                'total_charge_points' => $chargePoints->count(),
            ]
        ]);
    }

    /**
     * Store a new charging service.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'rate_per_kwh' => 'required|numeric|min:0|max:999.9999',
            'currency' => 'required|string|size:3',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $service = ChargingService::create($validated);

        // Broadcast admin service creation event
        AdminChargingServiceUpdated::dispatch($service, 'created', auth('admin')->id());

        return redirect()->route('admin.services.index')
                        ->with('success', 'Charging service created successfully.');
    }

    /**
     * Display the specified service with detailed analytics.
     */
    public function show(ChargingService $service): Response
    {
        $sessions = ChargingSession::where('charging_service_id', $service->id)
            ->with(['chargePoint'])
            ->latest()
            ->paginate(20);

        $transactions = ChargingTransaction::where('charging_service_id', $service->id)
            ->with(['chargePoint'])
            ->latest()
            ->paginate(20);

        $stats = [
            'total_sessions' => ChargingSession::where('charging_service_id', $service->id)->count(),
            'active_sessions' => ChargingSession::where('charging_service_id', $service->id)->active()->count(),
            'total_energy' => ChargingTransaction::where('charging_service_id', $service->id)->sum('energy_consumed'),
            'total_revenue' => ChargingTransaction::where('charging_service_id', $service->id)->sum('total_amount'),
        ];

        return Inertia::render('admin/services/show', [
            'service' => $service,
            'sessions' => $sessions,
            'transactions' => $transactions,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit(ChargingService $service): Response
    {
        return Inertia::render('admin/services/edit', [
            'service' => $service,
        ]);
    }

    /**
     * Update the specified service.
     */
    public function update(Request $request, ChargingService $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'rate_per_kwh' => 'required|numeric|min:0|max:999.9999',
            'currency' => 'required|string|size:3',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $service->update($validated);

        // Broadcast admin service update event
        AdminChargingServiceUpdated::dispatch($service, 'updated', auth('admin')->id());

        return redirect()->route('admin.services.index')
                        ->with('success', 'Charging service updated successfully.');
    }

    /**
     * Remove the specified service.
     */
    public function destroy(ChargingService $service)
    {
        // Check if service has active sessions
        if ($service->chargingSessions()->active()->exists()) {
            return redirect()->route('admin.services.index')
                            ->withErrors(['error' => 'Cannot delete service with active charging sessions.']);
        }

        // Broadcast admin service deletion event before deletion
        AdminChargingServiceUpdated::dispatch($service, 'deleted', auth('admin')->id());
        
        $service->delete();

        return redirect()->route('admin.services.index')
                        ->with('success', 'Charging service deleted successfully.');
    }

    /**
     * Start a simulation session for testing.
     */
    public function startSimulation(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'charging_service_id' => 'required|exists:charging_services,id',
            'charge_point_id' => 'required|exists:charge_points,id',
            'connector_id' => 'integer|min:1|max:4',
        ]);

        $chargePoint = ChargePoint::findOrFail($validated['charge_point_id']);
        
        // Check if charge point is available
        if (!$chargePoint->isAvailable()) {
            return response()->json(['error' => 'Charge point is not available'], 422);
        }

        // Create simulation session
        $session = ChargingSession::create([
            'user_id' => $validated['user_id'],
            'charging_service_id' => $validated['charging_service_id'],
            'charge_point_id' => $validated['charge_point_id'],
            'connector_id' => $validated['connector_id'] ?? 1,
            'id_tag' => 'SIM-' . now()->format('YmdHis'),
            'transaction_id' => rand(1000, 9999),
            'status' => 'Active',
            'started_at' => now(),
            'meter_start' => rand(10000, 50000), // Random starting meter value
            'credits_reserved' => 100.00, // Reserve 100 credits for simulation
        ]);

        // Update charge point status
        $chargePoint->update(['status' => 'Occupied']);

        // Broadcast session started event
        ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));
        
        // Broadcast charge point status update
        ChargePointStatusUpdated::dispatch($chargePoint->fresh());

        return response()->json([
            'success' => true,
            'session' => $session
        ]);
    }

    /**
     * Force stop a charging session (admin action)
     */
    public function forceStopSession(Request $request, ChargingSession $session)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if (!in_array($session->status, ['Starting', 'Active', 'Paused'])) {
            return response()->json([
                'success' => false,
                'message' => 'Session is not active'
            ], 400);
        }

        // Force stop the session
        $session->update([
            'status' => 'Completed',
            'stopped_at' => now(),
            'credits_used' => $session->credits_reserved, // Use all reserved credits
        ]);

        // Create transaction
        $transaction = ChargingTransaction::create([
            'charging_session_id' => $session->id,
            'user_id' => $session->user_id,
            'charging_service_id' => $session->charging_service_id,
            'charge_point_id' => $session->charge_point_id,
            'transaction_reference' => 'ADM-' . strtoupper(uniqid()),
            'energy_consumed' => $session->energy_consumed,
            'total_amount' => $session->credits_used,
            'duration_minutes' => $session->getDurationInMinutes(),
            'session_started_at' => $session->started_at,
        ]);

        // Update charge point status
        $session->chargePoint->update(['status' => 'Available']);

        // Broadcast events
        AdminSessionForceStop::dispatch($session, auth('admin')->id(), $validated['reason']);
        ChargingSessionStopped::dispatch($session, $transaction);
        ChargePointStatusUpdated::dispatch($session->chargePoint);

        return response()->json([
            'success' => true,
            'message' => 'Session force stopped successfully'
        ]);
    }

    /**
     * Manage charge point status (admin action)
     */
    public function manageChargePoint(Request $request, ChargePoint $chargePoint)
    {
        $validated = $request->validate([
            'action' => 'required|in:enable,disable,maintenance,reset',
            'message' => 'nullable|string|max:255',
        ]);

        $statusMap = [
            'enable' => 'Available',
            'disable' => 'Unavailable',
            'maintenance' => 'Faulted',
            'reset' => 'Available',
        ];

        $chargePoint->update([
            'status' => $statusMap[$validated['action']]
        ]);

        // If disabling/maintenance, stop any active sessions
        if (in_array($validated['action'], ['disable', 'maintenance'])) {
            $activeSessions = $chargePoint->chargingSessions()->active()->get();
            
            foreach ($activeSessions as $session) {
                $session->update([
                    'status' => 'Completed',
                    'stopped_at' => now(),
                    'credits_used' => $session->credits_reserved,
                ]);

                $transaction = ChargingTransaction::create([
                    'charging_session_id' => $session->id,
                    'user_id' => $session->user_id,
                    'charging_service_id' => $session->charging_service_id,
                    'charge_point_id' => $session->charge_point_id,
                    'transaction_reference' => 'ADM-' . strtoupper(uniqid()),
                    'energy_consumed' => $session->energy_consumed,
                    'total_amount' => $session->credits_used,
                    'duration_minutes' => $session->getDurationInMinutes(),
                    'session_started_at' => $session->started_at,
                ]);

                AdminSessionForceStop::dispatch($session, auth('admin')->id(), 'Charge point maintenance');
                ChargingSessionStopped::dispatch($session, $transaction);
            }
        }

        // Broadcast charge point management event
        AdminChargePointManaged::dispatch(
            $chargePoint, 
            $validated['action'], 
            auth('admin')->id(), 
            $validated['message']
        );
        ChargePointStatusUpdated::dispatch($chargePoint);

        return response()->json([
            'success' => true,
            'message' => "Charge point {$validated['action']} successfully"
        ]);
    }

    /**
     * Toggle service active status (admin action)
     */
    public function toggleServiceStatus(ChargingService $service)
    {
        $service->update(['is_active' => !$service->is_active]);
        
        $action = $service->is_active ? 'activated' : 'deactivated';
        AdminChargingServiceUpdated::dispatch($service, $action, auth('admin')->id());

        return response()->json([
            'success' => true,
            'message' => "Service {$action} successfully"
        ]);
    }

    /**
     * Stop a simulation session.
     */
    public function stopSimulation(ChargingSession $session)
    {
        if (!$session->isActive()) {
            return response()->json(['error' => 'Session is not active'], 422);
        }

        // Simulate energy consumption
        $durationMinutes = abs($session->getDurationInMinutes());
        $simulatedConsumption = abs(round($durationMinutes * 0.5, 3)); // 0.5 kWh per minute simulation
        $meterStop = $session->meter_start + ($simulatedConsumption * 1000); // Convert to Wh

        // Calculate cost
        $cost = $session->chargingService->calculateCost($simulatedConsumption);
        
        // Ensure cost is positive
        $cost = abs($cost);

        // Update session
        $session->update([
            'status' => 'Completed',
            'stopped_at' => now(),
            'meter_stop' => abs($meterStop),
            'energy_consumed' => abs($simulatedConsumption),
            'credits_used' => abs($cost),
            'stop_reason' => 'Remote',
        ]);

        // Create transaction record
        $transaction = ChargingTransaction::create([
            'charging_session_id' => $session->id,
            'user_id' => $session->user_id,
            'charging_service_id' => $session->charging_service_id,
            'charge_point_id' => $session->charge_point_id,
            'transaction_reference' => 'TXN-ADMIN-' . now()->format('YmdHis') . '-' . \Illuminate\Support\Str::random(4),
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

        return back()->with('success', 'Session stopped successfully');
    }
}