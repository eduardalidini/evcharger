<?php

namespace App\Events;

use App\Models\ChargingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChargingSessionStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargingSession $session
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        \Log::info('ChargingSessionStarted broadcasting to channels', [
            'session_id' => $this->session->id,
            'user_id' => $this->session->user_id,
            'charge_point_id' => $this->session->charge_point_id
        ]);
        
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
        
        \Log::info('Broadcasting ChargingSessionStarted event', [
            'session_id' => $this->session->id,
            'user_id' => $this->session->user_id,
            'charge_point_id' => $this->session->charge_point_id
        ]);
        
        return [
            'session' => [
                'id' => $this->session->id,
                'user_id' => $this->session->user_id,
                'user_name' => $user ? $user->name . ' ' . $user->surname : 'Unknown',
                'service_name' => $this->session->chargingService->name,
                'charge_point_id' => $this->session->charge_point_id,
                'charge_point_name' => $this->session->chargePoint->name,
                'connector_id' => $this->session->connector_id,
                'status' => $this->session->status,
                'started_at' => $this->session->started_at->toISOString(),
                'credits_reserved' => $this->session->credits_reserved,
                'rate_per_kwh' => $this->session->chargingService->rate_per_kwh,
            ]
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.started';
    }
}
