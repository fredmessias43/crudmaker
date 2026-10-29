<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Client;


class ClientRequest extends FormRequest
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
	
					if ( ! $this->has('phone'))
					{
							$this->merge(['phone' => $client->phone]);
					}
	
					if ( ! $this->has('document'))
					{
							$this->merge(['document' => $client->document]);
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
				'phone' => array(
					'bail',
					'required',
					'string',
				),
				'document' => array(
					'bail',
					'required',
					'string',
				),
			];
	}

};
