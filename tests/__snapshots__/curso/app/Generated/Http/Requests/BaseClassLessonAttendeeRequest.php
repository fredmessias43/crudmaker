<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\ClassLessonAttendeeRequest (app/Http/Requests/ClassLessonAttendeeRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLessonAttendee;
use Illuminate\Validation\Rule;


abstract class BaseClassLessonAttendeeRequest extends FormRequest
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
	 * Get the validation rules that apply to the request: as geradas mais as de `extraRules()`.
	 *
	 * @return array
	*/
	public function rules()
	{
			return array_merge($this->generatedRules(), $this->extraRules());
	}

	/**
	 * Hook: regras de validação que se somam às geradas (a mesma chave de campo substitui a regra gerada).
	 * Sobrescreva na classe final. Para mudar a autorização, sobrescreva também `authorize()` lá.
	 *
	 * @return array
	 */
	protected function extraRules(): array
	{
		return [];
	}

	/**
	 * Regras geradas a partir do manifest.
	 *
	 * @return array
	 */
	private function generatedRules(): array
	{
			return [
				'class_lesson_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('class_lessons', 'id'),
				),
				'user_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('users', 'id'),
				),
			];
	}

}
