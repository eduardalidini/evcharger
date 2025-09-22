<?php

namespace App\Console\Commands;

use App\Events\ChargingSessionStarted;
use App\Models\ChargingSession;
use Illuminate\Console\Command;

class TestBroadcasting extends Command
{
    protected $signature = 'test:broadcasting';
    protected $description = 'Test broadcasting functionality';

    public function handle()
    {
        $this->info('Testing broadcasting...');
        
        // Find a recent session or create a test one
        $session = ChargingSession::with(['chargingService', 'chargePoint'])->first();
        
        if (!$session) {
            $this->error('No charging sessions found. Please create a session first.');
            return;
        }
        
        $this->info("Broadcasting test event for session ID: {$session->id}");
        
        try {
            ChargingSessionStarted::dispatch($session);
            $this->info('✅ Event dispatched successfully!');
            $this->info('Check your browser console and Laravel logs for broadcast details.');
        } catch (\Exception $e) {
            $this->error('❌ Error dispatching event: ' . $e->getMessage());
        }
    }
}
