<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\PlayerRequest (app/Http/Requests/PlayerRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Player;
use Illuminate\Validation\Rule;


abstract class BasePlayerRequest extends FormRequest
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
			$player = $this->route('player');
	
			if ($player instanceof Player)
			{
					$this->merge(['id' => $player->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $player->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $player->name]);
					}
	
					if ( ! $this->has('email'))
					{
							$this->merge(['email' => $player->email]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $player->game_id]);
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
				'name' => array(
					'bail',
					'required',
					'string',
				),
				'email' => array(
					'bail',
					'required',
					'string',
				),
				'game_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('games', 'id'),
				),
			];
	}

}
