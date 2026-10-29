<?php

namespace Database\Seeders;

use App\Models\Order;
use Illuminate\Database\Seeder;
use App\Models\User;

/**
 * Seeder de Order, criado pelo crudmaker (crudmaker generate --seeders) uma única vez.
 *
 * Este arquivo é seu e nunca é sobrescrito: mude a quantidade, use os estados da factory
 * (Order::factory()->exemplo()) ou escreva registros fixos. A ordem entre os seeders é a do CrudmakerSeeder.
 */
class OrderSeeder extends Seeder
{
	public function run(): void
	{
		Order::factory()
			->count(10)
			->state(fn () => [
				'user_id' => User::query()->inRandomOrder()->value('id') ?? User::factory(),
			])
			->create();
	}
}
