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
        Schema::create('charge_points', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique(); // OCPP charge point identifier
            $table->string('name'); // Human readable name
            $table->string('location')->nullable();
            $table->enum('status', ['Available', 'Occupied', 'Unavailable', 'Faulted'])->default('Available');
            $table->integer('connector_count')->default(1);
            $table->decimal('max_power', 8, 2)->nullable(); // Max power in kW
            $table->string('firmware_version')->nullable();
            $table->timestamp('last_heartbeat')->nullable();
            $table->boolean('is_simulation')->default(false); // For testing
            $table->json('configuration')->nullable(); // OCPP configuration keys
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'is_simulation']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charge_points');
    }
};