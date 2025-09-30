<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OcppLogCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $cpId, public array $log) {}

    public function broadcastOn(): array
    {
        return [new Channel('charging.global')];
    }

    public function broadcastAs(): string
    {
        return 'ocpp.log';
    }
}
