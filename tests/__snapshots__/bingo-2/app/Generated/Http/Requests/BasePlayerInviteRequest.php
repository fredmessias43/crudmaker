<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\PlayerInviteRequest (app/Http/Requests/PlayerInviteRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\PlayerInvite;
use App\Generated\Enums\PlayerInviteStatus;
use App\Models\Game;
use App\Models\Player;
use Illuminate\Validation\Rule;


abstract class BasePlayerInviteRequest extends FormRequest
{

	/**
	 * Determine if the user is authorized to make this request.
	 *
	 * @return bool
	 */
	public function authorize()
	{
		return true;
	}

	/**
	 * Prepare the data for validation.
	 *
	 * @return void
	 */
	protected function prepareForValidation()
	{
			// Rota aninhada: a chave estrangeira vem do Game da URL e vale mais que o corpo.
			$game = $this->route('game');

			if ($game instanceof Game)
			{
					$this->merge(['game_id' => $game->getKey()]);
			}

			// Rota aninhada: a chave estrangeira vem do Player da URL e vale mais que o corpo.
			$player = $this->route('player');

			if ($player instanceof Player)
			{
					$this->merge(['player_id' => $player->getKey()]);
			}

			$playerInvite = $this->route('player_invite');
	
			if ($playerInvite instanceof PlayerInvite)
			{
					$this->merge(['id' => $playerInvite->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $playerInvite->id]);
					}
	
					if ( ! $this->has('player_id'))
					{
							$this->merge(['player_id' => $playerInvite->player_id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $playerInvite->game_id]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $playerInvite->status?->value]);
					}
	
			}
			else
			{
					//
			}
	}

	/**
	 * Get the validation rules that apply to the request: as geradas mais as de `extraRules()`.
	 *
	 * @return array
	*/
	public function rules()
	{
			return array_merge($this->generatedRules(), $this->extraRules());
	}

	/**
	 * Hook: regras de validação que se somam às geradas (a mesma chave de campo substitui a regra gerada).
	 * Sobrescreva na classe final. Para mudar a autorização, sobrescreva também `authorize()` lá.
	 *
	 * @return array
	 */
	protected function extraRules(): array
	{
		return [];
	}

	/**
	 * Regras geradas a partir do manifest.
	 *
	 * @return array
	 */
	private function generatedRules(): array
	{
			return [
				'player_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('players', 'id'),
				),
				'game_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('games', 'id'),
				),
				'status' => array(
					'bail',
					'required',
					Rule::enum(PlayerInviteStatus::class),
				),
			];
	}

}
