<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\OrderItemFactory (database/factories/OrderItemFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\OrderItem;
use App\Generated\Enums\OrderItemStatus;
use App\Models\Order;
use App\Models\User;

/**
 * @extends Factory<OrderItem>
 */
abstract class BaseOrderItemFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em OrderItem::factory() e que esta factory cria.
	 *
	 * @var class-string<OrderItem>
	 */
	protected $model = OrderItem::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'sku' => fake()->unique()->words(3, true),
			'quantity' => fake()->numberBetween(1, 1000),
			'price' => fake()->randomFloat(2, 0, 1000),
			'gift' => fake()->boolean(),
			'options' => [],
			'shipped_on' => fake()->date(),
			'packed_at' => fake()->dateTime(),
			'status' => fake()->randomElement(OrderItemStatus::cases()),
			'order_id' => Order::factory(),
			'author_id' => User::factory(),
		];
	}
}
