<?php

namespace App\Http\Controllers\Admin;

use App\Events\ChargePointStatusUpdated;
use App\Events\ChargingSessionStarted;
use App\Events\ChargingSessionStopped;
use App\Events\ChargingSessionUpdated;
use App\Http\Controllers\Controller;
use App\Models\BusinessUser;
use App\Models\ChargePoint;
use App\Models\ChargingService;
use App\Models\ChargingSession;
use App\Models\IndividualUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = ChargingSession::query()
            ->active()
            ->with(['chargePoint:id,name,identifier,status', 'chargingService:id,name,currency'])
            ->orderByDesc('started_at')
            ->get()
            ->map(function (ChargingSession $s) {
                $user = $s->user();

                return [
                    'id' => $s->id,
                    'status' => $s->status,
                    'started_at' => optional($s->started_at)?->toIso8601String(),
                    'duration_minutes' => $s->getDurationInMinutes(),
                    'energy_consumed' => (float) ($s->energy_consumed ?? 0),
                    'credits_used' => (float) ($s->credits_used ?? 0),
                    'connector_id' => $s->connector_id,
                    'charge_point' => [
                        'id' => $s->charge_point_id,
                        'name' => optional($s->chargePoint)->name,
                        'identifier' => optional($s->chargePoint)->identifier,
                        'status' => optional($s->chargePoint)->status,
                    ],
                    'service' => [
                        'id' => $s->charging_service_id,
                        'name' => optional($s->chargingService)->name,
                        'currency' => optional($s->chargingService)->currency,
                    ],
                    'user' => [
                        'id' => $s->user_id,
                        'type' => $user?->user_type ?? null,
                        'full_name' => $user ? trim(($user->name ?? '').' '.($user->surname ?? '')) : 'Unknown',
                        'email' => $user->email ?? null,
                    ],
                ];
            });

        return Inertia::render('admin/sessions/index', [
            'activeSessions' => $sessions,
        ]);
    }

    public function active(Request $request)
    {
        $sessions = ChargingSession::query()
            ->active()
            ->with(['chargePoint:id,name,identifier,status', 'chargingService:id,name,currency'])
            ->orderByDesc('started_at')
            ->get()
            ->map(function (ChargingSession $s) {
                $user = $s->user();

                return [
                    'id' => $s->id,
                    'status' => $s->status,
                    'started_at' => optional($s->started_at)?->toIso8601String(),
                    'duration_minutes' => $s->getDurationInMinutes(),
                    'energy_consumed' => (float) ($s->energy_consumed ?? 0),
                    'credits_used' => (float) ($s->credits_used ?? 0),
                    'connector_id' => $s->connector_id,
                    'charge_point' => [
                        'id' => $s->charge_point_id,
                        'name' => optional($s->chargePoint)->name,
                        'identifier' => optional($s->chargePoint)->identifier,
                        'status' => optional($s->chargePoint)->status,
                    ],
                    'service' => [
                        'id' => $s->charging_service_id,
                        'name' => optional($s->chargingService)->name,
                        'currency' => optional($s->chargingService)->currency,
                    ],
                    'user' => [
                        'id' => $s->user_id,
                        'type' => $user?->user_type ?? null,
                        'full_name' => $user ? trim(($user->name ?? '').' '.($user->surname ?? '')) : 'Unknown',
                        'email' => $user->email ?? null,
                    ],
                ];
            });

        return response()->json(['data' => $sessions]);
    }

    public function users(Request $request)
    {
        $individual = IndividualUser::query()
            ->select(['id', 'name', 'surname', 'email'])
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'type' => 'individual',
                'full_name' => trim(($u->name ?? '').' '.($u->surname ?? '')),
                'email' => $u->email,
            ]);

        $business = BusinessUser::query()
            ->select(['id', 'name', 'surname', 'email'])
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id + 1000000, // offset to ensure uniqueness across tables
                'type' => 'business',
                'full_name' => trim(($u->name ?? '').' '.($u->surname ?? '')),
                'email' => $u->email,
            ]);

        $all = $individual->merge($business)->values();

        return response()->json(['data' => $all]);
    }

    public function services(Request $request)
    {
        $services = ChargingService::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'currency']);

        return response()->json(['data' => $services]);
    }

    public function chargePoints(Request $request)
    {
        $chargePoints = ChargePoint::query()->available()->orderBy('name')->get(['id', 'name', 'identifier', 'status']);

        return response()->json(['data' => $chargePoints]);
    }

    public function start(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'user_type' => 'required|string|in:individual,business',
            'charging_service_id' => 'required|exists:charging_services,id',
            'charge_point_id' => 'required|exists:charge_points,id',
            'connector_id' => 'integer|min:1|max:4',
        ]);

        $chargePoint = ChargePoint::findOrFail($validated['charge_point_id']);
        if (! $chargePoint->isAvailable()) {
            return response()->json(['error' => 'Charge point is not available'], 422);
        }

        DB::transaction(function () use ($validated, $chargePoint) {
            // decode composite id
            $compositeId = (int) $validated['user_id'];
            $isBusiness = $validated['user_type'] === 'business';
            $actualUserId = $isBusiness ? ($compositeId - 1000000) : $compositeId;

            $session = ChargingSession::create([
                'user_id' => $actualUserId,
                'charging_service_id' => $validated['charging_service_id'],
                'charge_point_id' => $validated['charge_point_id'],
                'connector_id' => $validated['connector_id'] ?? 1,
                'id_tag' => 'ADMIN_'.$validated['user_id'],
                'status' => 'Active',
                'started_at' => now(),
                'last_activity' => now(),
                'credits_reserved' => 10.0,
                'ocpp_data' => [
                    'meter_start' => 0,
                    'transaction_id' => rand(1000, 9999),
                    'user_type' => $validated['user_type'],
                ],
            ]);

            $chargePoint->update(['status' => 'Occupied']);
            ChargingSessionStarted::dispatch($session->load(['chargingService', 'chargePoint']));
            ChargePointStatusUpdated::dispatch($chargePoint->fresh());
        });

        return response()->json(['success' => true]);
    }

    public function pause(Request $request, ChargingSession $session)
    {
        if ($session->status !== 'Active') {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Session is not active'], 422);
            }

            return back()->withErrors(['error' => 'Session is not active']);
        }

        $session->update(['status' => 'Paused', 'last_activity' => now()]);
        ChargingSessionUpdated::dispatch($session->fresh()->load(['chargingService', 'chargePoint']));
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Session paused');
    }

    public function resume(Request $request, ChargingSession $session)
    {
        if ($session->status !== 'Paused') {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Session is not paused'], 422);
            }

            return back()->withErrors(['error' => 'Session is not paused']);
        }

        $session->update(['status' => 'Active', 'last_activity' => now()]);
        ChargingSessionUpdated::dispatch($session->fresh()->load(['chargingService', 'chargePoint']));
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Session resumed');
    }

    public function stop(Request $request, ChargingSession $session)
    {
        if (! in_array($session->status, ['Active', 'Paused'])) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Session cannot be stopped'], 422);
            }

            return back()->withErrors(['error' => 'Session cannot be stopped']);
        }

        DB::transaction(function () use ($session) {
            $durationMinutes = abs(now()->diffInMinutes($session->started_at));
            $simulatedConsumption = abs(round($durationMinutes * 0.5, 3));
            $cost = abs($session->chargingService->calculateCost($simulatedConsumption));

            $session->update([
                'status' => 'Completed',
                'stopped_at' => now(),
                'energy_consumed' => abs($simulatedConsumption),
                'credits_used' => abs($cost),
                'meter_stop' => abs($simulatedConsumption) * 1000,
                'stop_reason' => 'Remote',
            ]);

            $session->chargePoint->update(['status' => 'Available']);

            $transaction = \App\Models\ChargingTransaction::create([
                'charging_session_id' => $session->id,
                'user_id' => $session->user_id,
                'charging_service_id' => $session->charging_service_id,
                'charge_point_id' => $session->charge_point_id,
                'transaction_reference' => 'TXN-ADMIN-'.now()->format('YmdHis').'-'.\Illuminate\Support\Str::random(4),
                'session_started_at' => $session->started_at,
                'session_stopped_at' => $session->stopped_at,
                'duration_minutes' => abs($durationMinutes),
                'energy_consumed' => abs($simulatedConsumption),
                'rate_per_kwh' => $session->chargingService->rate_per_kwh,
                'total_amount' => abs($cost),
            ]);

            ChargingSessionStopped::dispatch($session->fresh()->load(['chargingService', 'chargePoint']), $transaction);
            ChargePointStatusUpdated::dispatch($session->chargePoint->fresh());
        });

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Session stopped');
    }
}
