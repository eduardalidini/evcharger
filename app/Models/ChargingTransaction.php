<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChargingTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'charging_session_id',
        'user_id',
        'charging_service_id',
        'charge_point_id',
        'transaction_reference',
        'session_started_at',
        'session_stopped_at',
        'duration_minutes',
        'energy_consumed',
        'rate_per_kwh',
        'total_amount',
        'currency',
        'status',
        'meter_values',
        'ocpp_transaction_data',
        'notes',
    ];

    protected $casts = [
        'session_started_at' => 'datetime',
        'session_stopped_at' => 'datetime',
        'energy_consumed' => 'decimal:3',
        'rate_per_kwh' => 'decimal:4',
        'total_amount' => 'decimal:2',
        'meter_values' => 'array',
        'ocpp_transaction_data' => 'array',
    ];

    /**
     * Get the charging session for this transaction.
     */
    public function chargingSession(): BelongsTo
    {
        return $this->belongsTo(ChargingSession::class);
    }

    /**
     * Get the charging service for this transaction.
     */
    public function chargingService(): BelongsTo
    {
        return $this->belongsTo(ChargingService::class);
    }

    /**
     * Get the charge point for this transaction.
     */
    public function chargePoint(): BelongsTo
    {
        return $this->belongsTo(ChargePoint::class);
    }

    /**
     * Get the user for this transaction (dynamic relationship).
     */
    public function user()
    {
        // First try individual users
        $individualUser = IndividualUser::find($this->user_id);
        if ($individualUser) {
            $individualUser->user_type = 'individual';
            return $individualUser;
        }
        
        // Then try business users
        $businessUser = BusinessUser::find($this->user_id);
        if ($businessUser) {
            $businessUser->user_type = 'business';
            return $businessUser;
        }
        
        return null;
    }

    /**
     * Generate a unique transaction reference.
     */
    public static function generateReference(): string
    {
        $prefix = 'CHG-' . now()->format('Ymd') . '-';
        $latest = static::whereDate('created_at', now())
            ->latest('id')
            ->first();
        
        $number = $latest ? (int) substr($latest->transaction_reference, -4) + 1 : 1;
        
        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method to auto-generate reference.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($transaction) {
            if (!$transaction->transaction_reference) {
                $transaction->transaction_reference = static::generateReference();
            }
        });
    }

    /**
     * Get the formatted total amount.
     */
    public function getFormattedTotalAttribute(): string
    {
        return number_format($this->total_amount, 2) . ' ' . $this->currency;
    }

    /**
     * Get the formatted energy consumed.
     */
    public function getFormattedEnergyAttribute(): string
    {
        return number_format($this->energy_consumed, 3) . ' kWh';
    }

    /**
     * Get the formatted duration.
     */
    public function getFormattedDurationAttribute(): string
    {
        $hours = intval($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;
        
        if ($hours > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }
        
        return $minutes . 'm';
    }
}