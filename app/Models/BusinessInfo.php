<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessInfo extends Model
{
    use HasFactory;

    protected $table = 'business_info';

    protected $fillable = [
        'admin_id',
        'business_name',
        'business_number',
        'vat_number',
        'business_address',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public static function setDefault($adminId, $businessId)
    {
        // Remove default from all other business info for this admin
        static::where('admin_id', $adminId)
            ->where('id', '!=', $businessId)
            ->update(['is_default' => false]);

        // Set the selected one as default
        static::where('id', $businessId)
            ->update(['is_default' => true]);
    }
}
