<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Alert;


class AlertRequest extends FormRequest
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
	
					if ( ! $this->has('message'))
					{
							$this->merge(['message' => $alert->message]);
					}
	
					if ( ! $this->has('alertDate'))
					{
							$this->merge(['alertDate' => $alert->alertDate]);
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
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	*/
	public function rules()
	{
			return [
				'message' => array(
					'bail',
					'required',
					'string',
				),
				'alertDate' => array(
					'bail',
					'required',
					'date_format:Y-m-d H:i',
				),
				'client_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
