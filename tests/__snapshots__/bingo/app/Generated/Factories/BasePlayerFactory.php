<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\PlayerFactory (database/factories/PlayerFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Player;
use App\Models\Game;

/**
 * @extends Factory<Player>
 */
abstract class BasePlayerFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Player::factory() e que esta factory cria.
	 *
	 * @var class-string<Player>
	 */
	protected $model = Player::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'name' => fake()->name(),
			'email' => fake()->safeEmail(),
			'game_id' => Game::factory(),
		];
	}
}
