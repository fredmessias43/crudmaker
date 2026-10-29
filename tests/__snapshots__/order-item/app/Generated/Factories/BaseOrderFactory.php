<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\OrderFactory (database/factories/OrderFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Order;
use App\Models\User;

/**
 * @extends Factory<Order>
 */
abstract class BaseOrderFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Order::factory() e que esta factory cria.
	 *
	 * @var class-string<Order>
	 */
	protected $model = Order::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'number' => fake()->unique()->words(3, true),
			'user_id' => User::factory(),
		];
	}
}
