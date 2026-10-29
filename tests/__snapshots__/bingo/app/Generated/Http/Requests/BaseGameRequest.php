<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\GameRequest (app/Http/Requests/GameRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Game;
use Illuminate\Validation\Rule;


abstract class BaseGameRequest extends FormRequest
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
			$game = $this->route('game');
	
			if ($game instanceof Game)
			{
					$this->merge(['id' => $game->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $game->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $game->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $game->description]);
					}
	
					if ( ! $this->has('max_players'))
					{
							$this->merge(['max_players' => $game->max_players]);
					}
	
					if ( ! $this->has('document'))
					{
							$this->merge(['document' => $game->document]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $game->status]);
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
				'description' => array(
					'bail',
					'required',
					'string',
				),
				'max_players' => array(
					'bail',
					'required',
					'integer',
				),
				'document' => array(
					'bail',
					'required',
					'string',
				),
				'status' => array(
					'bail',
					'required',
					Rule::in(array('active','inactive','archived','completed')),
				),
			];
	}

}
