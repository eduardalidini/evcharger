<?php

namespace App\Events;

use App\Models\ChargePoint;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChargePointStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargePoint $chargePoint
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.charging'),
            new PrivateChannel('charging.global'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'charge_point' => [
                'id' => $this->chargePoint->id,
                'identifier' => $this->chargePoint->identifier,
                'name' => $this->chargePoint->name,
                'location' => $this->chargePoint->location,
                'status' => $this->chargePoint->status,
                'connector_count' => $this->chargePoint->connector_count,
                'max_power' => $this->chargePoint->max_power,
                'is_simulation' => $this->chargePoint->is_simulation,
                'updated_at' => $this->chargePoint->updated_at->toISOString(),
            ]
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'charge_point.status_updated';
    }
}
