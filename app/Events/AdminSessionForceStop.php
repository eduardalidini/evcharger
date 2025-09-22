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

class AdminSessionForceStop implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChargingSession $session,
        public int $adminId,
        public string $reason = 'Administrative action'
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.charging.' . $this->session->user_id), // Specific user
            new PrivateChannel('admin.charging'), // Admin panel
            new PrivateChannel('charging.global'), // Global updates
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
                'charge_point_name' => $this->session->chargePoint->name,
                'status' => $this->session->status,
                'started_at' => $this->session->started_at,
            ],
            'admin_id' => $this->adminId,
            'reason' => $this->reason,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'session.force_stopped';
    }
}
