<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Student;


class StudentRequest extends FormRequest
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
			$student = $this->route('student');
	
			if ($student instanceof Student)
			{
					$this->merge(['id' => $student->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $student->id]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $student->status]);
					}
	
					if ( ! $this->has('classroom_id'))
					{
							$this->merge(['classroom_id' => $student->classroom_id]);
					}
	
					if ( ! $this->has('user_id'))
					{
							$this->merge(['user_id' => $student->user_id]);
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
				'status' => array(
					'bail',
					'required',
					'string',
				),
				'classroom_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'user_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
