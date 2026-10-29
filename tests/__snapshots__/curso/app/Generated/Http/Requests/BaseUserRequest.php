<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\UserRequest (app/Http/Requests/UserRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;


abstract class BaseUserRequest extends FormRequest
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
			$user = $this->route('user');
	
			if ($user instanceof User)
			{
					$this->merge(['id' => $user->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $user->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $user->name]);
					}
	
					if ( ! $this->has('email'))
					{
							$this->merge(['email' => $user->email]);
					}
	
					if ( ! $this->has('password'))
					{
							$this->merge(['password' => $user->password]);
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
				'password' => array(
					'bail',
					'required',
					'string',
				),
			];
	}

}
