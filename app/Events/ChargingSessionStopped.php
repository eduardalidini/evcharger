<?php

namespace App\Events;

use App\Models\ChargingSession;
use App\Models\ChargingTransaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChargingSessionStopped implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargingSession $session,
        public ChargingTransaction $transaction
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.charging'),
            new PrivateChannel('user.charging.' . $this->session->user_id),
            new PrivateChannel('charging.global'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $user = $this->session->user();
        
        return [
            'session' => [
                'id' => $this->session->id,
                'user_id' => $this->session->user_id,
                'user_name' => $user ? $user->name . ' ' . $user->surname : 'Unknown',
                'service_name' => $this->session->chargingService->name,
                'charge_point_id' => $this->session->charge_point_id,
                'charge_point_name' => $this->session->chargePoint->name,
                'status' => $this->session->status,
                'stopped_at' => $this->session->stopped_at,
                'energy_consumed' => $this->session->energy_consumed,
                'credits_used' => $this->session->credits_used,
                'duration_minutes' => $this->session->getDurationInMinutes(),
            ],
            'transaction' => [
                'id' => $this->transaction->id,
                'transaction_reference' => $this->transaction->transaction_reference,
                'user_name' => $user ? $user->name . ' ' . $user->surname : 'Unknown',
                'service_name' => $this->session->chargingService->name,
                'charge_point_name' => $this->session->chargePoint->name,
                'total_amount' => $this->transaction->total_amount,
                'energy_consumed' => $this->transaction->energy_consumed,
                'duration_minutes' => $this->transaction->duration_minutes,
                'session_started_at' => $this->session->started_at,
                'created_at' => $this->transaction->created_at,
            ]
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.stopped';
    }
}
