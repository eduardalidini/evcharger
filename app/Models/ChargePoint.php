<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChargePoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'identifier',
        'name',
        'location',
        'status',
        'connector_count',
        'max_power',
        'firmware_version',
        'last_heartbeat',
        'is_simulation',
        'configuration',
        'metadata',
    ];

    protected $casts = [
        'max_power' => 'decimal:2',
        'last_heartbeat' => 'datetime',
        'is_simulation' => 'boolean',
        'configuration' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the charging sessions for this charge point.
     */
    public function chargingSessions(): HasMany
    {
        return $this->hasMany(ChargingSession::class);
    }

    /**
     * Get the charging transactions for this charge point.
     */
    public function chargingTransactions(): HasMany
    {
        return $this->hasMany(ChargingTransaction::class);
    }

    /**
     * Get the active session for this charge point and connector.
     */
    public function activeSession(int $connectorId = 1)
    {
        return $this->chargingSessions()
            ->where('connector_id', $connectorId)
            ->whereIn('status', ['Starting', 'Active', 'Paused'])
            ->first();
    }

    /**
     * Scope to get only available charge points.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'Available');
    }

    /**
     * Scope to get only simulation charge points.
     */
    public function scopeSimulation($query)
    {
        return $query->where('is_simulation', true);
    }

    /**
     * Scope to get only real charge points.
     */
    public function scopeReal($query)
    {
        return $query->where('is_simulation', false);
    }

    /**
     * Check if the charge point is available for new sessions.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'Available';
    }

    /**
     * Check if the charge point is currently charging.
     */
    public function isCharging(): bool
    {
        return $this->status === 'Occupied';
    }

    /**
     * Update the heartbeat timestamp.
     */
    public function updateHeartbeat(): void
    {
        $this->update(['last_heartbeat' => now()]);
    }

    /**
     * Check if the charge point is online (heartbeat within last 5 minutes).
     */
    public function isOnline(): bool
    {
        return $this->last_heartbeat && $this->last_heartbeat->gt(now()->subMinutes(5));
    }
}