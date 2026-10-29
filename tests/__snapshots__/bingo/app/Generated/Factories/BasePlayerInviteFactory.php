<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\PlayerInviteFactory (database/factories/PlayerInviteFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\PlayerInvite;
use App\Models\Player;
use App\Models\Game;
use App\Generated\Enums\PlayerInviteStatus;

/**
 * @extends Factory<PlayerInvite>
 */
abstract class BasePlayerInviteFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em PlayerInvite::factory() e que esta factory cria.
	 *
	 * @var class-string<PlayerInvite>
	 */
	protected $model = PlayerInvite::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'player_id' => Player::factory(),
			'game_id' => Game::factory(),
			'status' => fake()->randomElement(PlayerInviteStatus::cases()),
		];
	}
}
