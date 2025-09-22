<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     */
    protected $commands = [
        Commands\OcppWebSocketServer::class,
        Commands\CheckLowCreditSessionsCommand::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Only keep essential scheduled tasks - NO slow session updates!
        // Live updates are now handled by the real-time WebSocket server
        
        // Check for low credit sessions every 2 minutes (this can stay scheduled)
        $schedule->command('charging:check-credits')
                ->everyTwoMinutes()
                ->withoutOverlapping()
                ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}