<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate --seeders`.
// Chama o seeder de cada entidade, na ordem de dependência das chaves estrangeiras (o pai antes do filho).
// Para usá-lo, chame-o uma vez no DatabaseSeeder: $this->call(CrudmakerSeeder::class);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CrudmakerSeeder extends Seeder
{
	public function run(): void
	{
		$this->call([
			UserSeeder::class,
			OrderSeeder::class,
			OrderItemSeeder::class,
		]);
	}
}
