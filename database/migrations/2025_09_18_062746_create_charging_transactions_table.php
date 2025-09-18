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
        Schema::create('charging_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('charging_session_id')->constrained('charging_sessions');
            $table->unsignedBigInteger('user_id');
            $table->foreignId('charging_service_id')->constrained('charging_services');
            $table->foreignId('charge_point_id')->constrained('charge_points');
            $table->string('transaction_reference')->unique(); // Unique reference for the transaction
            $table->timestamp('session_started_at');
            $table->timestamp('session_stopped_at');
            $table->integer('duration_minutes'); // Total session duration
            $table->decimal('energy_consumed', 12, 3); // kWh consumed
            $table->decimal('rate_per_kwh', 8, 4); // Rate at time of transaction
            $table->decimal('total_amount', 10, 2); // Total credits charged
            $table->string('currency', 3)->default('ALL');
            $table->enum('status', ['Completed', 'Refunded', 'Disputed'])->default('Completed');
            $table->json('meter_values')->nullable(); // Historical meter readings
            $table->json('ocpp_transaction_data')->nullable(); // Complete OCPP transaction data
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index(['charge_point_id', 'created_at']);
            $table->index(['status', 'created_at']);
            
            // User can be individual or business
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charging_transactions');
    }
};