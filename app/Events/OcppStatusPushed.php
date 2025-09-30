<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OcppStatusPushed implements ShouldBroadcastNow
{
    public function __construct(
        public string $identifier,
        public int $connectorId,
        public string $status,
        public ?string $timestamp = null,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('charging.global');
    }

    public function broadcastAs(): string
    {
        return 'ocpp.status';
    }

    public function broadcastWith(): array
    {
        return [
            'identifier' => $this->identifier,
            'connectorId' => $this->connectorId,
            'status' => $this->status,
            'timestamp' => $this->timestamp,
        ];
    }
}


