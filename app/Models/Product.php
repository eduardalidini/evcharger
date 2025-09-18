<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'sku',
        'type',
        'price',
        'currency',
        'currency_id',
        'credit_value',
        'credit_to_currency_rate',
        'is_active',
        'is_featured',
        'sort_order',
        'track_quantity',
        'quantity',
        'min_quantity',
        'max_per_user',
        'max_per_transaction',
        'metadata',
        'image_url',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'credit_value' => 'decimal:2',
        'credit_to_currency_rate' => 'decimal:4',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'track_quantity' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        // Ensure type is always 'credit' for new products
        static::creating(function ($product) {
            $product->type = 'credit';
        });
    }

    /**
     * Get the currency that this product is priced in.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Scope to get only active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only credit products.
     */
    public function scopeCredits($query)
    {
        return $query->where('type', 'credit');
    }

    /**
     * Scope to get only featured products.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Check if the product is a credit product.
     */
    public function isCreditProduct(): bool
    {
        return $this->type === 'credit';
    }

    /**
     * Check if the product is in stock (if tracking quantity).
     */
    public function isInStock(): bool
    {
        if (!$this->track_quantity) {
            return true; // Digital products are always in stock
        }

        return $this->quantity > 0;
    }

    /**
     * Check if the product has sufficient stock for the requested quantity.
     */
    public function hasSufficientStock(int $requestedQuantity): bool
    {
        if (!$this->track_quantity) {
            return true; // Digital products don't have stock limits
        }

        return $this->quantity >= $requestedQuantity;
    }

    /**
     * Reduce the product quantity (for tracked products).
     */
    public function reduceStock(int $quantity): bool
    {
        if (!$this->track_quantity) {
            return true; // No need to track stock for digital products
        }

        if (!$this->hasSufficientStock($quantity)) {
            return false;
        }

        $this->decrement('quantity', $quantity);
        return true;
    }

    /**
     * Get the formatted price with currency.
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2) . ' ' . $this->currency;
    }

    /**
     * Get the total credit value that would be added to user's balance.
     */
    public function getTotalCreditValueAttribute(): float
    {
        if (!$this->isCreditProduct()) {
            return 0;
        }

        return (float) $this->credit_value;
    }
}
