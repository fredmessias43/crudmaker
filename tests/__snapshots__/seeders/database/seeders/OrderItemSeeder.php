<?php

namespace Database\Seeders;

use App\Models\OrderItem;
use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\User;

/**
 * Seeder de OrderItem, criado pelo crudmaker (crudmaker generate --seeders) uma única vez.
 *
 * Este arquivo é seu e nunca é sobrescrito: mude a quantidade, use os estados da factory
 * (OrderItem::factory()->exemplo()) ou escreva registros fixos. A ordem entre os seeders é a do CrudmakerSeeder.
 */
class OrderItemSeeder extends Seeder
{
	public function run(): void
	{
		OrderItem::factory()
			->count(10)
			->state(fn () => [
				'order_id' => Order::query()->inRandomOrder()->value('id') ?? Order::factory(),
				'author_id' => User::query()->inRandomOrder()->value('id') ?? User::factory(),
			])
			->create();
	}
}
