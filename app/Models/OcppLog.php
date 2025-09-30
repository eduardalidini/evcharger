<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OcppLog extends Model
{
    protected $fillable = ['cp_log', 'raw'];
}
