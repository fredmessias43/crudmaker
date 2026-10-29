<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\GameFactory (database/factories/GameFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Game;
use App\Generated\Enums\GameStatus;

/**
 * @extends Factory<Game>
 */
abstract class BaseGameFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Game::factory() e que esta factory cria.
	 *
	 * @var class-string<Game>
	 */
	protected $model = Game::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'name' => fake()->name(),
			'description' => fake()->sentence(),
			'max_players' => fake()->numberBetween(1, 1000),
			'document' => fake()->words(3, true),
			'status' => fake()->randomElement(GameStatus::cases()),
		];
	}
}
