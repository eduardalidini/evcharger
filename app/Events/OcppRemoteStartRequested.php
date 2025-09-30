<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class OcppRemoteStartRequested implements ShouldBroadcast
{
    public function __construct(
        public string $identifier,
        public string $idTag,
        public int $connectorId = 1,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('charging.global');
    }

    public function broadcastAs(): string
    {
        return 'ocpp.remote_start';
    }

    public function broadcastWith(): array
    {
        return [
            'identifier' => $this->identifier,
            'idTag' => $this->idTag,
            'connectorId' => $this->connectorId,
        ];
    }
}


