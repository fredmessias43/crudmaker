<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\CardsFactory (database/factories/CardsFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Cards;
use App\Models\Game;
use App\Models\Player;

/**
 * @extends Factory<Cards>
 */
abstract class BaseCardsFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Cards::factory() e que esta factory cria.
	 *
	 * @var class-string<Cards>
	 */
	protected $model = Cards::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'game_id' => Game::factory(),
			'player_id' => Player::factory(),
			'numbers' => [],
		];
	}
}
