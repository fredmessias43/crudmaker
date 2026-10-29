<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLessonComment;


class ClassLessonCommentRequest extends FormRequest
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
			$classLessonComment = $this->route('class_lesson_comment');
	
			if ($classLessonComment instanceof ClassLessonComment)
			{
					$this->merge(['id' => $classLessonComment->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $classLessonComment->id]);
					}
	
					if ( ! $this->has('class_lesson_id'))
					{
							$this->merge(['class_lesson_id' => $classLessonComment->class_lesson_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $classLessonComment->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $classLessonComment->description]);
					}
	
					if ( ! $this->has('link'))
					{
							$this->merge(['link' => $classLessonComment->link]);
					}
	
					if ( ! $this->has('pdf'))
					{
							$this->merge(['pdf' => $classLessonComment->pdf]);
					}
	
					if ( ! $this->has('user_id'))
					{
							$this->merge(['user_id' => $classLessonComment->user_id]);
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
				'user_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
