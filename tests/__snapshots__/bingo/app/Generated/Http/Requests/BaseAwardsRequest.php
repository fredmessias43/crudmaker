<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\AwardsRequest (app/Http/Requests/AwardsRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Awards;
use App\Models\Game;
use Illuminate\Validation\Rule;


abstract class BaseAwardsRequest extends FormRequest
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

			$awards = $this->route('awards');
	
			if ($awards instanceof Awards)
			{
					$this->merge(['id' => $awards->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $awards->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $awards->game_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $awards->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $awards->description]);
					}
	
					if ( ! $this->has('image_url'))
					{
							$this->merge(['image_url' => $awards->image_url]);
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
