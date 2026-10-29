<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\AlertFactory (database/factories/AlertFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Alert;
use App\Models\Client;

/**
 * @extends Factory<Alert>
 */
abstract class BaseAlertFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Alert::factory() e que esta factory cria.
	 *
	 * @var class-string<Alert>
	 */
	protected $model = Alert::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'title' => fake()->sentence(3),
			'client_id' => Client::factory(),
		];
	}
}
