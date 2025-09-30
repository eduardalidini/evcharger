<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class IndividualUser extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'individual_users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'surname',
        'id_number',
        'phone_no',
        'email',
        'balance',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
        ];
    }

    /**
     * Transient attribute to expose a logical user type without persisting it.
     */
    protected $appends = ['user_type'];

    public function getUserTypeAttribute(): string
    {
        return 'individual';
    }
}
function getUserTypeAttribute(): string
{
    return 'individual';
}
