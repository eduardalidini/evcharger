<?php

namespace App\Console\Commands;

use App\Jobs\CheckLowCreditSessions;
use Illuminate\Console\Command;

class CheckLowCreditSessionsCommand extends Command
{
    protected $signature = 'charging:check-credits';
    protected $description = 'Check for active sessions with insufficient credits and stop them automatically';

    public function handle()
    {
        $this->info('Checking for sessions with insufficient credits...');
        
        CheckLowCreditSessions::dispatch();
        
        $this->info('Low credit check job dispatched successfully.');
        return 0;
    }
}