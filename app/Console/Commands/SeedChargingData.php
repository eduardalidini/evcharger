<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChargingService;
use App\Models\ChargePoint;

class SeedChargingData extends Command
{
    protected $signature = 'charging:seed';
    protected $description = 'Seed charging services and charge points data';

    public function handle()
    {
        $this->info('Seeding charging data...');

        // Create Fast Charging service if it doesn't exist
        $fastCharging = ChargingService::firstOrCreate(
            ['name' => 'Fast Charging'],
            [
                'description' => 'High-speed DC charging for electric vehicles',
                'rate_per_kwh' => 40.0000,
                'currency' => 'ALL',
                'is_active' => true,
                'sort_order' => 1,
                'configuration' => [
                    'max_power' => 50,
                    'connector_types' => ['CCS', 'CHAdeMO'],
                    'payment_methods' => ['credits']
                ],
                'metadata' => [
                    'display_name' => 'Fast Charging',
                    'icon' => 'zap'
                ]
            ]
        );

        $this->info('✓ Fast Charging service created/updated');

        // Create simulation charge points
        $simPoints = [
            [
                'identifier' => 'SIM-001',
                'name' => 'Simulation Station 1',
                'location' => 'Test Location A',
                'status' => 'Available',
                'connector_count' => 2,
                'max_power' => 50,
                'firmware_version' => '1.6.0',
                'configuration' => [
                    'HeartbeatInterval' => 300,
                    'MeterValueSampleInterval' => 60,
                    'StopTransactionOnEVSideDisconnect' => true
                ],
                'metadata' => [
                    'manufacturer' => 'Virtual',
                    'model' => 'Simulator v1.0'
                ]
            ],
            [
                'identifier' => 'SIM-002',
                'name' => 'Simulation Station 2',
                'location' => 'Test Location B',
                'status' => 'Available',
                'connector_count' => 1,
                'max_power' => 25,
                'firmware_version' => '1.6.0',
                'configuration' => [
                    'HeartbeatInterval' => 300,
                    'MeterValueSampleInterval' => 60,
                    'StopTransactionOnEVSideDisconnect' => true
                ],
                'metadata' => [
                    'manufacturer' => 'Virtual',
                    'model' => 'Simulator v1.0'
                ]
            ]
        ];

        foreach ($simPoints as $pointData) {
            ChargePoint::firstOrCreate(
                ['identifier' => $pointData['identifier']],
                $pointData
            );
            $this->info("✓ Charge point {$pointData['identifier']} created/updated");
        }

        $this->info('Charging data seeding completed successfully!');
        return 0;
    }
}