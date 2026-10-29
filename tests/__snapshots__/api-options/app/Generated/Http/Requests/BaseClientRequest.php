<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\ClientRequest (app/Http/Requests/ClientRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Client;
use Illuminate\Validation\Rule;


abstract class BaseClientRequest extends FormRequest
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
			$client = $this->route('client');
	
			if ($client instanceof Client)
			{
					$this->merge(['id' => $client->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $client->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $client->name]);
					}
	
					if ( ! $this->has('email'))
					{
							$this->merge(['email' => $client->email]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $client->status]);
					}
	
					if ( ! $this->has('vip'))
					{
							$this->merge(['vip' => $client->vip]);
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
					Rule::unique('clients', 'email')->ignore($this->route('client')),
				),
				'status' => array(
					'bail',
					'required',
					Rule::in(array('active','blocked')),
				),
				'vip' => array(
					'bail',
					'required',
					'boolean',
				),
			];
	}

}
