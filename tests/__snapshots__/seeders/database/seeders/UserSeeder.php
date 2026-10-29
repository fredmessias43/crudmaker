<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder de User, criado pelo crudmaker (crudmaker generate --seeders) uma única vez.
 *
 * Este arquivo é seu e nunca é sobrescrito: mude a quantidade, use os estados da factory
 * (User::factory()->exemplo()) ou escreva registros fixos. A ordem entre os seeders é a do CrudmakerSeeder.
 */
class UserSeeder extends Seeder
{
	public function run(): void
	{
		User::factory()
			->count(10)
			->create();
	}
}
