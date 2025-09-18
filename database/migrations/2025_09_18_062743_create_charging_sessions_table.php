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
        Schema::create('charging_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->foreignId('charging_service_id')->constrained('charging_services');
            $table->foreignId('charge_point_id')->constrained('charge_points');
            $table->integer('connector_id')->default(1);
            $table->string('id_tag', 20); // OCPP identifier
            $table->integer('transaction_id')->nullable(); // OCPP transaction ID
            $table->enum('status', ['Starting', 'Active', 'Paused', 'Stopping', 'Completed', 'Faulted'])->default('Starting');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('stopped_at')->nullable();
            $table->timestamp('last_activity')->nullable();
            $table->decimal('meter_start', 12, 3)->default(0); // Starting meter value in Wh
            $table->decimal('meter_stop', 12, 3)->nullable(); // Ending meter value in Wh
            $table->decimal('energy_consumed', 12, 3)->default(0); // kWh consumed
            $table->decimal('credits_reserved', 10, 2)->default(0); // Credits reserved at start
            $table->decimal('credits_used', 10, 2)->default(0); // Actual credits charged
            $table->string('stop_reason')->nullable(); // OCPP stop reason
            $table->json('ocpp_data')->nullable(); // Raw OCPP messages
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['charge_point_id', 'status']);
            $table->index(['status', 'started_at']);
            
            // User can be individual or business
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charging_sessions');
    }
};