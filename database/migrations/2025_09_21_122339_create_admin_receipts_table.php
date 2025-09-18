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
        Schema::create('admin_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('admin_id')->constrained()->onDelete('cascade');
            // Decouple from old users table: keep as plain FK-like column with index
            $table->unsignedBigInteger('user_id');
            $table->index('user_id');
            $table->enum('type', ['receipt'])->default('receipt');
            
            // Business Information
            $table->string('business_name')->default('EV Charging Station');
            $table->string('business_number')->nullable();
            $table->string('business_vat')->nullable();
            $table->text('business_address')->nullable();
            
            // Basic amounts
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EUR');
            $table->text('description')->nullable();
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            
            // EV Charging Specific Fields
            $table->integer('charging_duration_minutes')->nullable();
            $table->string('vehicle_registration')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('charger_type')->nullable();
            $table->decimal('rate_per_kwh', 8, 4)->nullable();
            $table->decimal('kwh_consumed', 8, 3)->nullable();
            $table->decimal('tax_rate_percentage', 5, 2)->default(0);
            
            // Payment and status
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('due_date')->nullable();
            
            // Base64 PDF storage
            $table->longText('pdf_base64')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_receipts');
    }
};
