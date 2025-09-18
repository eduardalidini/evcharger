<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The table associated with the model.
     * This will be determined dynamically based on the user type.
     */
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
        'nipt',
        'isBusiness',
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
            'isBusiness' => 'boolean',
        ];
    }

    /**
     * Find a user by their email across both tables
     */
    public static function findByEmail($email)
    {
        // Try individual users first
        $user = IndividualUser::where('email', $email)->first();
        if ($user) {
            $user->user_type = 'individual';
            return $user;
        }

        // Try business users
        $user = BusinessUser::where('email', $email)->first();
        if ($user) {
            $user->user_type = 'business';
            return $user;
        }

        return null;
    }

    /**
     * Find a user by their ID across both tables
     */
    public static function findById($id)
    {
        // Try individual users first
        $user = IndividualUser::find($id);
        if ($user) {
            $user->user_type = 'individual';
            return $user;
        }

        // Try business users
        $user = BusinessUser::find($id);
        if ($user) {
            $user->user_type = 'business';
            return $user;
        }

        return null;
    }
}
