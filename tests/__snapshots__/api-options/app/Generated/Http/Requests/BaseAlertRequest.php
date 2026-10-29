<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\AlertRequest (app/Http/Requests/AlertRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Alert;


abstract class BaseAlertRequest extends FormRequest
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
			$alert = $this->route('alert');
	
			if ($alert instanceof Alert)
			{
					$this->merge(['id' => $alert->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $alert->id]);
					}
	
					if ( ! $this->has('title'))
					{
							$this->merge(['title' => $alert->title]);
					}
	
					if ( ! $this->has('client_id'))
					{
							$this->merge(['client_id' => $alert->client_id]);
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
				'title' => array(
					'bail',
					'required',
					'string',
				),
				'client_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

}
