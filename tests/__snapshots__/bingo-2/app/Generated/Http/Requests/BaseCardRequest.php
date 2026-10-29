<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\CardRequest (app/Http/Requests/CardRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Card;


abstract class BaseCardRequest extends FormRequest
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
			$card = $this->route('card');
	
			if ($card instanceof Card)
			{
					$this->merge(['id' => $card->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $card->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $card->game_id]);
					}
	
					if ( ! $this->has('player_id'))
					{
							$this->merge(['player_id' => $card->player_id]);
					}
	
					if ( ! $this->has('numbers'))
					{
							$this->merge(['numbers' => $card->numbers]);
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
				'game_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'player_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'numbers' => array(
					'bail',
					'required',
					'array',
				),
			];
	}

}
