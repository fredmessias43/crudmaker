<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\UserCourse;


class UserCourseRequest extends FormRequest
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
			$userCourse = $this->route('user_course');
	
			if ($userCourse instanceof UserCourse)
			{
					$this->merge(['id' => $userCourse->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $userCourse->id]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $userCourse->status]);
					}
	
					if ( ! $this->has('user_id'))
					{
							$this->merge(['user_id' => $userCourse->user_id]);
					}
	
					if ( ! $this->has('course_id'))
					{
							$this->merge(['course_id' => $userCourse->course_id]);
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
				'user_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'course_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
