<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLesson;


class ClassLessonRequest extends FormRequest
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
			$classLesson = $this->route('class_lesson');
	
			if ($classLesson instanceof ClassLesson)
			{
					$this->merge(['id' => $classLesson->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $classLesson->id]);
					}
	
					if ( ! $this->has('class_id'))
					{
							$this->merge(['class_id' => $classLesson->class_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $classLesson->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $classLesson->description]);
					}
	
					if ( ! $this->has('link'))
					{
							$this->merge(['link' => $classLesson->link]);
					}
	
					if ( ! $this->has('pdf'))
					{
							$this->merge(['pdf' => $classLesson->pdf]);
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
				'class_id' => array(
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
