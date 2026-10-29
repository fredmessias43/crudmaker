<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\OrderItem;
use Illuminate\Validation\Rule;


class OrderItemRequest extends FormRequest
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
							$this->merge(['status' => $orderItem->status]);
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
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	*/
	public function rules()
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
					Rule::in(array('pending','shipped')),
				),
				'order_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'author_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
