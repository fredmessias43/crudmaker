<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\OrderItemRequest (app/Http/Requests/OrderItemRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\OrderItem;
use App\Generated\Enums\OrderItemStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\Rule;


abstract class BaseOrderItemRequest extends FormRequest
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
			// Rota aninhada: a chave estrangeira vem do Order da URL e vale mais que o corpo.
			$order = $this->route('order');

			if ($order instanceof Order)
			{
					$this->merge(['order_id' => $order->getKey()]);
			}

			// Rota aninhada: a chave estrangeira vem do User da URL e vale mais que o corpo.
			$user = $this->route('user');

			if ($user instanceof User)
			{
					$this->merge(['author_id' => $user->getKey()]);
			}

			$orderItem = $this->route('order_item');
	
			if ($orderItem instanceof OrderItem)
			{
					$this->merge(['id' => $orderItem->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $orderItem->id]);
					}
	
					if ( ! $this->has('sku'))
					{
							$this->merge(['sku' => $orderItem->sku]);
					}
	
					if ( ! $this->has('quantity'))
					{
							$this->merge(['quantity' => $orderItem->quantity]);
					}
	
					if ( ! $this->has('price'))
					{
							$this->merge(['price' => $orderItem->price]);
					}
	
					if ( ! $this->has('gift'))
					{
							$this->merge(['gift' => $orderItem->gift]);
					}
	
					if ( ! $this->has('options'))
					{
							$this->merge(['options' => $orderItem->options]);
					}
	
					if ( ! $this->has('shipped_on'))
					{
							$this->merge(['shipped_on' => $orderItem->shipped_on?->format('Y-m-d')]);
					}
	
					if ( ! $this->has('packed_at'))
					{
							$this->merge(['packed_at' => $orderItem->packed_at?->format('Y-m-d H:i')]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $orderItem->status?->value]);
					}
	
					if ( ! $this->has('order_id'))
					{
							$this->merge(['order_id' => $orderItem->order_id]);
					}
	
					if ( ! $this->has('author_id'))
					{
							$this->merge(['author_id' => $orderItem->author_id]);
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
				'sku' => array(
					'bail',
					'required',
					'string',
					Rule::unique('order_items', 'sku')->ignore($this->route('order_item')),
				),
				'quantity' => array(
					'bail',
					'required',
					'integer',
				),
				'price' => array(
					'bail',
					'required',
					'numeric',
				),
				'gift' => array(
					'bail',
					'required',
					'boolean',
				),
				'options' => array(
					'bail',
					'nullable',
					'array',
				),
				'shipped_on' => array(
					'bail',
					'nullable',
					'date_format:Y-m-d',
				),
				'packed_at' => array(
					'bail',
					'nullable',
					'date_format:Y-m-d H:i',
				),
				'status' => array(
					'bail',
					'required',
					Rule::enum(OrderItemStatus::class),
				),
				'order_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('orders', 'id'),
				),
				'author_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('users', 'id'),
				),
			];
	}

}
