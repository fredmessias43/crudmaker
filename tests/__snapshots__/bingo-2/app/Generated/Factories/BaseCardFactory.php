<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\CardFactory (database/factories/CardFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Card;
use App\Models\Game;
use App\Models\Player;

/**
 * @extends Factory<Card>
 */
abstract class BaseCardFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Card::factory() e que esta factory cria.
	 *
	 * @var class-string<Card>
	 */
	protected $model = Card::class;

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
