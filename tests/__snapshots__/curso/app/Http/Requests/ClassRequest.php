<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Class;


class ClassRequest extends FormRequest
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
			$class = $this->route('class');
	
			if ($class instanceof Class)
			{
					$this->merge(['id' => $class->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $class->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $class->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $class->description]);
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
				'description' => array(
					'bail',
					'nullable',
					'string',
				),
			];
	}

};
