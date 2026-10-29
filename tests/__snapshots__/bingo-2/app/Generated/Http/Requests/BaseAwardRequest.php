<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\AwardRequest (app/Http/Requests/AwardRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Award;
use App\Models\Game;
use Illuminate\Validation\Rule;


abstract class BaseAwardRequest extends FormRequest
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

			$award = $this->route('award');
	
			if ($award instanceof Award)
			{
					$this->merge(['id' => $award->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $award->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $award->game_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $award->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $award->description]);
					}
	
					if ( ! $this->has('image_url'))
					{
							$this->merge(['image_url' => $award->image_url]);
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
				'name' => array(
					'bail',
					'required',
					'string',
				),
				'description' => array(
					'bail',
					'required',
					'string',
				),
				'image_url' => array(
					'bail',
					'required',
					'string',
				),
			];
	}

}
