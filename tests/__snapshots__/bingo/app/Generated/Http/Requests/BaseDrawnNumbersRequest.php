<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\DrawnNumbersRequest (app/Http/Requests/DrawnNumbersRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\DrawnNumbers;
use App\Models\Game;
use Illuminate\Validation\Rule;


abstract class BaseDrawnNumbersRequest extends FormRequest
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

			$drawnNumbers = $this->route('drawn_numbers');
	
			if ($drawnNumbers instanceof DrawnNumbers)
			{
					$this->merge(['id' => $drawnNumbers->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $drawnNumbers->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $drawnNumbers->game_id]);
					}
	
					if ( ! $this->has('number'))
					{
							$this->merge(['number' => $drawnNumbers->number]);
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
					Rule::exists('games', 'id'),
				),
				'number' => array(
					'bail',
					'required',
					'integer',
				),
			];
	}

}
