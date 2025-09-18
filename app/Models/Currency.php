<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $table = 'currencies';
    protected $fillable = [
        'currency_code',
        'price_per_kwh',
        'tax_percent',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'price_per_kwh' => 'decimal:2',
        'tax_percent' => 'decimal:2',
    ];
}

