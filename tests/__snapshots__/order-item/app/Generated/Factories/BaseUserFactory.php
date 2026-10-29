<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\UserFactory (database/factories/UserFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

/**
 * @extends Factory<User>
 */
abstract class BaseUserFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em User::factory() e que esta factory cria.
	 *
	 * @var class-string<User>
	 */
	protected $model = User::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'name' => fake()->name(),
		];
	}
}
