<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\AwardFactory (database/factories/AwardFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Award;
use App\Models\Game;

/**
 * @extends Factory<Award>
 */
abstract class BaseAwardFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Award::factory() e que esta factory cria.
	 *
	 * @var class-string<Award>
	 */
	protected $model = Award::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'game_id' => Game::factory(),
			'name' => fake()->name(),
			'description' => fake()->sentence(),
			'image_url' => fake()->url(),
		];
	}
}
