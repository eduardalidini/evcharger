<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $hasNipt = fake()->boolean(30); // 30% chance of having NIPT (business)
        
        return [
            'name' => fake()->firstName(),
            'surname' => fake()->lastName(),
            'id_number' => fake()->unique()->numerify('##########'),
            'phone_no' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'nipt' => $hasNipt ? fake()->numerify('##########') : null,
            'isBusiness' => $hasNipt,
            'balance' => fake()->randomFloat(2, 0, 1000),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
