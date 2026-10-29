<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Address;


class AddressRequest extends FormRequest
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
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	*/
	public function rules()
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
				),
			];
	}

};
