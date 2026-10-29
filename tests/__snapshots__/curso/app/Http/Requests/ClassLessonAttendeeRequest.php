<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLessonAttendee;


class ClassLessonAttendeeRequest extends FormRequest
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
			$classLessonAttendee = $this->route('class_lesson_attendee');
	
			if ($classLessonAttendee instanceof ClassLessonAttendee)
			{
					$this->merge(['id' => $classLessonAttendee->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $classLessonAttendee->id]);
					}
	
					if ( ! $this->has('class_lesson_id'))
					{
							$this->merge(['class_lesson_id' => $classLessonAttendee->class_lesson_id]);
					}
	
					if ( ! $this->has('user_id'))
					{
							$this->merge(['user_id' => $classLessonAttendee->user_id]);
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
				'class_lesson_id' => array(
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
