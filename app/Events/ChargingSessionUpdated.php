<?php

namespace App\Events;

use App\Models\ChargingSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChargingSessionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargingSession $session,
        public array $meterValues = []
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.charging'),
            new PrivateChannel('user.charging.'.$this->session->user_id),
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
                'user_name' => $user ? $user->name.' '.$user->surname : 'Unknown',
                'status' => $this->session->status,
                'charge_point_id' => $this->session->charge_point_id,
                'charge_point_status' => $this->session->chargePoint->status,
                'energy_consumed' => $this->session->energy_consumed,
                'credits_used' => $this->session->credits_used,
                'duration_minutes' => $this->session->getDurationInMinutes(),
                'last_activity' => $this->session->last_activity,
            ],
            'meter_values' => $this->meterValues,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.updated';
    }
}
