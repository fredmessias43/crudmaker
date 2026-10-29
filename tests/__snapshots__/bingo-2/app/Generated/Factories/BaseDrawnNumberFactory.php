<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\DrawnNumberFactory (database/factories/DrawnNumberFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\DrawnNumber;
use App\Models\Game;

/**
 * @extends Factory<DrawnNumber>
 */
abstract class BaseDrawnNumberFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em DrawnNumber::factory() e que esta factory cria.
	 *
	 * @var class-string<DrawnNumber>
	 */
	protected $model = DrawnNumber::class;

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
