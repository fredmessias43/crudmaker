<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\CourseContent;


class CourseContentRequest extends FormRequest
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
			$courseContent = $this->route('course_content');
	
			if ($courseContent instanceof CourseContent)
			{
					$this->merge(['id' => $courseContent->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $courseContent->id]);
					}
	
					if ( ! $this->has('course_id'))
					{
							$this->merge(['course_id' => $courseContent->course_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $courseContent->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $courseContent->description]);
					}
	
					if ( ! $this->has('link'))
					{
							$this->merge(['link' => $courseContent->link]);
					}
	
					if ( ! $this->has('pdf'))
					{
							$this->merge(['pdf' => $courseContent->pdf]);
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
				'course_id' => array(
					'bail',
					'required',
					'uuid',
				),
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
				'link' => array(
					'bail',
					'required',
					'string',
				),
				'pdf' => array(
					'bail',
					'required',
					'string',
				),
			];
	}

};
