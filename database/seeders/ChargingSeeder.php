<?php

namespace Database\Seeders;

use App\Models\ChargingService;
use App\Models\ChargePoint;
use Illuminate\Database\Seeder;

class ChargingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default charging service
        ChargingService::create([
            'name' => 'Fast Charging',
            'description' => 'High-speed DC charging for electric vehicles',
            'rate_per_kwh' => 40.0000,
            'currency' => 'ALL',
            'is_active' => true,
            'sort_order' => 1,
            'metadata' => [
                'max_power' => '50kW',
                'connector_type' => 'CCS2',
                'charging_type' => 'DC Fast'
            ]
        ]);

        // Create simulation charge points for testing
        ChargePoint::create([
            'identifier' => 'SIM-001',
            'name' => 'Simulation Station 1',
            'location' => 'Test Location',
            'status' => 'Available',
            'connector_count' => 2,
            'max_power' => 50.00,
            'firmware_version' => '1.6.0',
            'is_simulation' => true,
            'configuration' => [
                'HeartbeatInterval' => 300,
                'MeterValueSampleInterval' => 60,
                'StopTransactionOnEVSideDisconnect' => true
            ],
            'metadata' => [
                'manufacturer' => 'Virtual',
                'model' => 'Simulator v1.0'
            ]
        ]);

        ChargePoint::create([
            'identifier' => 'SIM-002',
            'name' => 'Simulation Station 2',
            'location' => 'Test Location',
            'status' => 'Available',
            'connector_count' => 1,
            'max_power' => 22.00,
            'firmware_version' => '1.6.0',
            'is_simulation' => true,
            'configuration' => [
                'HeartbeatInterval' => 300,
                'MeterValueSampleInterval' => 60,
                'StopTransactionOnEVSideDisconnect' => true
            ],
            'metadata' => [
                'manufacturer' => 'Virtual',
                'model' => 'Simulator v1.0'
            ]
        ]);
    }
}