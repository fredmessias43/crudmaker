<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\OrderRequest (app/Http/Requests/OrderRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\Rule;


abstract class BaseOrderRequest extends FormRequest
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
			// Rota aninhada: a chave estrangeira vem do User da URL e vale mais que o corpo.
			$user = $this->route('user');

			if ($user instanceof User)
			{
					$this->merge(['user_id' => $user->getKey()]);
			}

			// Rota aninhada: a chave estrangeira vem do User da URL e vale mais que o corpo.
			$user = $this->route('user');

			if ($user instanceof User)
			{
					$this->merge(['user_id' => $user->getKey()]);
			}

			$order = $this->route('order');
	
			if ($order instanceof Order)
			{
					$this->merge(['id' => $order->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $order->id]);
					}
	
					if ( ! $this->has('number'))
					{
							$this->merge(['number' => $order->number]);
					}
	
					if ( ! $this->has('user_id'))
					{
							$this->merge(['user_id' => $order->user_id]);
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
				'number' => array(
					'bail',
					'required',
					'string',
					Rule::unique('orders', 'number')->ignore($this->route('order')),
				),
				'user_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('users', 'id'),
				),
			];
	}

}
