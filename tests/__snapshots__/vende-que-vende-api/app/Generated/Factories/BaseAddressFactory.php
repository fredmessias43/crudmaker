<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\AddressFactory (database/factories/AddressFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Address;
use App\Models\Client;

/**
 * @extends Factory<Address>
 */
abstract class BaseAddressFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Address::factory() e que esta factory cria.
	 *
	 * @var class-string<Address>
	 */
	protected $model = Address::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'street' => fake()->streetAddress(),
			'city' => fake()->city(),
			'state' => fake()->state(),
			'zip' => fake()->postcode(),
			'client_id' => Client::factory(),
		];
	}
}
