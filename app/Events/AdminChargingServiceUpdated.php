<?php

namespace App\Events;

use App\Models\ChargingService;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminChargingServiceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargingService $service,
        public string $action, // 'created', 'updated', 'deleted', 'activated', 'deactivated'
        public ?int $adminId = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('charging.global'), // All users can see service changes
            new PrivateChannel('admin.charging'),  // Admin notification
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'service' => [
                'id' => $this->service->id,
                'name' => $this->service->name,
                'description' => $this->service->description,
                'rate_per_kwh' => $this->service->rate_per_kwh,
                'currency' => $this->service->currency,
                'is_active' => $this->service->is_active,
                'sort_order' => $this->service->sort_order,
            ],
            'action' => $this->action,
            'admin_id' => $this->adminId,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'service.updated';
    }
}
