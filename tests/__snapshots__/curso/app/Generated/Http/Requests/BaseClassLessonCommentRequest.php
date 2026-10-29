<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\ClassLessonCommentRequest (app/Http/Requests/ClassLessonCommentRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLessonComment;
use Illuminate\Validation\Rule;


abstract class BaseClassLessonCommentRequest extends FormRequest
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
					Rule::exists('users', 'id'),
				),
			];
	}

}
