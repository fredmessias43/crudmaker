<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\ClassLessonRequest (app/Http/Requests/ClassLessonRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\ClassLesson;
use Illuminate\Validation\Rule;


abstract class BaseClassLessonRequest extends FormRequest
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
	
					if ( ! $this->has('classroom_id'))
					{
							$this->merge(['classroom_id' => $classLesson->classroom_id]);
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
				'classroom_id' => array(
					'bail',
					'required',
					'uuid',
					Rule::exists('classrooms', 'id'),
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

}
