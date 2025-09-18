<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChargingService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'rate_per_kwh',
        'currency',
        'is_active',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'rate_per_kwh' => 'decimal:4',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Get the charging sessions for this service.
     */
    public function chargingSessions(): HasMany
    {
        return $this->hasMany(ChargingSession::class);
    }

    /**
     * Get the charging transactions for this service.
     */
    public function chargingTransactions(): HasMany
    {
        return $this->hasMany(ChargingTransaction::class);
    }

    /**
     * Scope to get only active services.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Calculate the cost for a given amount of energy.
     */
    public function calculateCost(float $kwhConsumed): float
    {
        $cost = round($kwhConsumed * $this->rate_per_kwh, 2);
        return abs($cost); // Ensure positive cost
    }

    /**
     * Check if the service is available.
     */
    public function isAvailable(): bool
    {
        return $this->is_active;
    }

    /**
     * Get the formatted rate per kWh.
     */
    public function getFormattedRateAttribute(): string
    {
        return number_format($this->rate_per_kwh, 2) . ' ' . $this->currency . '/kWh';
    }
}