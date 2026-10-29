<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\ClientFactory (database/factories/ClientFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Client;

/**
 * @extends Factory<Client>
 */
abstract class BaseClientFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Client::factory() e que esta factory cria.
	 *
	 * @var class-string<Client>
	 */
	protected $model = Client::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'name' => fake()->name(),
			'email' => fake()->safeEmail(),
			'phone' => fake()->phoneNumber(),
			'document' => fake()->words(3, true),
		];
	}
}
