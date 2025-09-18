<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Currency;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the ALL currency or create it if it doesn't exist
        $allCurrency = Currency::firstOrCreate(
            ['currency_code' => 'ALL'],
            [
                'price_per_kwh' => 15.00, // Default price per kWh in ALL
                'tax_percent' => 20.00,
                'is_default' => true,
            ]
        );

        // Credit Products - All products are credit packages with different values and discounts
        $creditProducts = [
            [
                'name' => 'Basic Credit Package',
                'description' => 'Add 100 credits to your account. Perfect for occasional charging sessions.',
                'sku' => 'CREDIT-100',
                'type' => 'credit',
                'price' => 100.00,
                'currency' => 'ALL',
                'currency_id' => $allCurrency->id,
                'credit_value' => 100.00,
                'credit_to_currency_rate' => 1.0000, // 1 credit = 1 ALL
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
                'track_quantity' => false, // Credit products are unlimited // Credit products are unlimited
                'metadata' => [
                    'best_for' => 'Light users',
                    'savings' => '0%',
                ]
            ],
            [
                'name' => 'Standard Credit Package',
                'description' => 'Add 500 credits to your account with 5% bonus. Great value for regular users.',
                'sku' => 'CREDIT-500',
                'type' => 'credit',
                'price' => 475.00, // 5% discount: 500 * 0.95
                'currency' => 'ALL',
                'currency_id' => $allCurrency->id,
                'credit_value' => 500.00,
                'credit_to_currency_rate' => 1.0000,
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
                'track_quantity' => false, // Credit products are unlimited
                'metadata' => [
                    'best_for' => 'Regular users',
                    'savings' => '5%',
                    'bonus_credits' => 25,
                ]
            ],
            [
                'name' => 'Premium Credit Package',
                'description' => 'Add 1000 credits to your account with 10% bonus. Best value for frequent users.',
                'sku' => 'CREDIT-1000',
                'type' => 'credit',
                'price' => 900.00, // 10% discount: 1000 * 0.9
                'currency' => 'ALL',
                'currency_id' => $allCurrency->id,
                'credit_value' => 1000.00,
                'credit_to_currency_rate' => 1.0000,
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 3,
                'track_quantity' => false, // Credit products are unlimited
                'metadata' => [
                    'best_for' => 'Frequent users',
                    'savings' => '10%',
                    'bonus_credits' => 100,
                ]
            ],
            [
                'name' => 'Business Credit Package',
                'description' => 'Add 5000 credits to your account with 15% bonus. Perfect for business fleets.',
                'sku' => 'CREDIT-5000',
                'type' => 'credit',
                'price' => 4250.00, // 15% discount: 5000 * 0.85
                'currency' => 'ALL',
                'currency_id' => $allCurrency->id,
                'credit_value' => 5000.00,
                'credit_to_currency_rate' => 1.0000,
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 4,
                'track_quantity' => false, // Credit products are unlimited
                'max_per_transaction' => 10, // Business can buy up to 10 packages at once
                'metadata' => [
                    'best_for' => 'Business fleets',
                    'savings' => '15%',
                    'bonus_credits' => 750,
                ]
            ],
        ];

        // Insert credit products
        foreach ($creditProducts as $product) {
            Product::create($product);
        }

        $this->command->info('Created ' . count($creditProducts) . ' credit products in LEK currency.');
    }
}
