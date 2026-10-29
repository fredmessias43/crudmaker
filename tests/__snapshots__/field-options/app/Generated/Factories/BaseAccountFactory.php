<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\AccountFactory (database/factories/AccountFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Account;
use Illuminate\Support\Facades\Hash;
use App\Generated\Enums\AccountPlan;

/**
 * @extends Factory<Account>
 */
abstract class BaseAccountFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Account::factory() e que esta factory cria.
	 *
	 * @var class-string<Account>
	 */
	protected $model = Account::class;

	/**
	 * A senha cifrada, reaproveitada entre as instâncias (cifrar é lento).
	 */
	protected static ?string $password = null;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'password' => static::$password ??= Hash::make('password'),
			'email' => fake()->unique()->safeEmail(),
			'nickname' => 'O\'Brien \\ Co',
			'bio' => 'sem bio',
			'owner_ref' => '00000000-0000-0000-0000-000000000000',
			'status' => 'active',
			'plan' => fake()->randomElement(AccountPlan::cases()),
			'age' => 18,
			'credit' => 12.5,
			'score' => 0,
			'active' => true,
			'newsletter' => false,
			'birthday' => '2000-01-31',
			'last_seen' => '2025-01-02 03:04:05',
			'settings' => [],
		];
	}
}
