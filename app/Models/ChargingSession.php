<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ChargingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'charging_service_id',
        'charge_point_id',
        'connector_id',
        'id_tag',
        'transaction_id',
        'status',
        'started_at',
        'stopped_at',
        'last_activity',
        'meter_start',
        'meter_stop',
        'energy_consumed',
        'credits_reserved',
        'credits_used',
        'stop_reason',
        'ocpp_data',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
        'last_activity' => 'datetime',
        'meter_start' => 'decimal:3',
        'meter_stop' => 'decimal:3',
        'energy_consumed' => 'decimal:3',
        'credits_reserved' => 'decimal:2',
        'credits_used' => 'decimal:2',
        'ocpp_data' => 'array',
    ];

    /**
     * Get the charging service for this session.
     */
    public function chargingService(): BelongsTo
    {
        return $this->belongsTo(ChargingService::class);
    }

    /**
     * Get the charge point for this session.
     */
    public function chargePoint(): BelongsTo
    {
        return $this->belongsTo(ChargePoint::class);
    }

    /**
     * Get the user for this session (dynamic relationship).
     */
    public function user()
    {
        $type = data_get($this->ocpp_data, 'user_type');
        if ($type === 'business') {
            $businessUser = BusinessUser::find($this->user_id);
            if ($businessUser) {
                $businessUser->user_type = 'business';

                return $businessUser;
            }
        } else {
            $individualUser = IndividualUser::find($this->user_id);
            if ($individualUser) {
                $individualUser->user_type = 'individual';

                return $individualUser;
            }
            $businessUser = BusinessUser::find($this->user_id);
            if ($businessUser) {
                $businessUser->user_type = 'business';

                return $businessUser;
            }
        }

        return null;
    }

    /**
     * Get the charging transaction for this session.
     */
    public function chargingTransaction(): HasOne
    {
        return $this->hasOne(ChargingTransaction::class);
    }

    /**
     * Scope to get active sessions.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['Starting', 'Active', 'Paused']);
    }

    /**
     * Scope to get completed sessions.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'Completed');
    }

    /**
     * Check if the session is active.
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['Starting', 'Active', 'Paused']);
    }

    /**
     * Check if the session can be paused.
     */
    public function canBePaused(): bool
    {
        return $this->status === 'Active';
    }

    /**
     * Check if the session can be resumed.
     */
    public function canBeResumed(): bool
    {
        return $this->status === 'Paused';
    }

    /**
     * Calculate energy consumed in kWh.
     */
    public function calculateEnergyConsumed(): float
    {
        if ($this->meter_stop && $this->meter_start) {
            return round(($this->meter_stop - $this->meter_start) / 1000, 3); // Convert Wh to kWh
        }

        return 0;
    }

    /**
     * Calculate session duration in minutes.
     */
    public function getDurationInMinutes(): int
    {
        if ($this->started_at && $this->stopped_at) {
            return abs($this->started_at->diffInMinutes($this->stopped_at));
        }

        if ($this->started_at) {
            return abs($this->started_at->diffInMinutes(now()));
        }

        return 0;
    }

    /**
     * Update last activity timestamp.
     */
    public function updateActivity(): void
    {
        $this->update(['last_activity' => now()]);
    }
}
