<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Classroom;


class ClassroomRequest extends FormRequest
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
			$classroom = $this->route('classroom');
	
			if ($classroom instanceof Classroom)
			{
					$this->merge(['id' => $classroom->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $classroom->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $classroom->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $classroom->description]);
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
