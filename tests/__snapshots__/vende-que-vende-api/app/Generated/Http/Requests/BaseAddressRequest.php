<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\AddressRequest (app/Http/Requests/AddressRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Address;
use Illuminate\Validation\Rule;


abstract class BaseAddressRequest extends FormRequest
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
			$address = $this->route('address');
	
			if ($address instanceof Address)
			{
					$this->merge(['id' => $address->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $address->id]);
					}
	
					if ( ! $this->has('street'))
					{
							$this->merge(['street' => $address->street]);
					}
	
					if ( ! $this->has('city'))
					{
							$this->merge(['city' => $address->city]);
					}
	
					if ( ! $this->has('state'))
					{
							$this->merge(['state' => $address->state]);
					}
	
					if ( ! $this->has('zip'))
					{
							$this->merge(['zip' => $address->zip]);
					}
	
					if ( ! $this->has('client_id'))
					{
							$this->merge(['client_id' => $address->client_id]);
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
				'street' => array(
					'bail',
					'required',
					'string',
				),
				'city' => array(
					'bail',
					'required',
					'string',
				),
				'state' => array(
					'bail',
					'required',
					'string',
				),
				'zip' => array(
					'bail',
					'required',
					'string',
				),
				'client_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('clients', 'id'),
				),
			];
	}

}
