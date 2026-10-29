<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Order;
use Illuminate\Validation\Rule;


class OrderRequest extends FormRequest
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
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	*/
	public function rules()
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
				),
			];
	}

};
