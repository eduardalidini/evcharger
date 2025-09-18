<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('charging_services', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Fast Charging"
            $table->text('description')->nullable();
            $table->decimal('rate_per_kwh', 8, 4); // 40.0000 ALL per kWh
            $table->string('currency', 3)->default('ALL');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable(); // For future extensibility
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charging_services');
    }
};