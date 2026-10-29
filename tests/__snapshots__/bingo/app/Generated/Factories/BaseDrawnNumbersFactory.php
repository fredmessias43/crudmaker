<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\DrawnNumbersFactory (database/factories/DrawnNumbersFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\DrawnNumbers;
use App\Models\Game;

/**
 * @extends Factory<DrawnNumbers>
 */
abstract class BaseDrawnNumbersFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em DrawnNumbers::factory() e que esta factory cria.
	 *
	 * @var class-string<DrawnNumbers>
	 */
	protected $model = DrawnNumbers::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'game_id' => Game::factory(),
			'number' => fake()->numberBetween(1, 1000),
		];
	}
}
