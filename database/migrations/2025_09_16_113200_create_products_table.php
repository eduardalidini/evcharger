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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            
            // Basic Product Information
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('sku')->unique(); // Stock Keeping Unit for product identification
            $table->enum('type', ['credit'])->default('credit');
            
            // Pricing Information
            $table->decimal('price', 10, 2); // Price in the specified currency
            $table->string('currency', 3)->default('ALL'); // Currency code (ALL for Albanian Lek)
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->onDelete('set null');
            
            // Credit System - Required for all products since only credits are supported
            $table->decimal('credit_value', 10, 2); // How many credits this product gives
            $table->decimal('credit_to_currency_rate', 10, 4)->default(1.0000); // 1 credit = X currency units
            
            // Product Management
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            
            // Stock Management (optional for credit products - usually unlimited)
            $table->boolean('track_quantity')->default(false);
            $table->integer('quantity')->nullable();
            $table->integer('min_quantity')->nullable(); // Minimum quantity to maintain
            
            // Purchase Limits
            $table->integer('max_per_user')->nullable(); // Maximum units per user
            $table->integer('max_per_transaction')->nullable(); // Maximum units per transaction
            
            // Metadata
            $table->json('metadata')->nullable(); // For storing additional credit product attributes (savings %, best_for, etc.)
            $table->string('image_url')->nullable(); // Product image
            
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['type', 'is_active']);
            $table->index(['currency', 'is_active']);
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
