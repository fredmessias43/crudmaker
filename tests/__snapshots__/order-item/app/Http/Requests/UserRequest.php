<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;


class UserRequest extends FormRequest
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
			];
	}

};
