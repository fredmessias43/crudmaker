<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\CourseCourseContentController (app/Http/Controllers/Api/Relationships/CourseCourseContentController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\CourseContentController;
use App\Models\Course;
use App\Models\CourseContent;
use App\Http\Requests\CourseContentRequest;
use App\Http\Resources\CourseContentCollection;
use App\Http\Resources\CourseContentResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Course -> courseContents (hasMany).
 *
 * Estende o controller de CourseContent: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseCourseCourseContentController extends CourseContentController
{

	/**
	 * Display a paginated listing of the CourseContent records of a Course.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de CourseContent.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Course $course): JsonResponse
	{
		$query = CourseContent::query()->where('course_id', $course->getKey());

		// Hooks do usuário: primeiro o de CourseContent (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $course);

		return (new CourseContentCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created CourseContent for a Course.
	 *
	 * A chave estrangeira ('course_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\CourseContentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(CourseContentRequest $request, Course $course): JsonResponse
	{
		$courseContent = DB::transaction(function () use ($request, $course) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $course);
			$data['course_id'] = $course->getKey();

			$model = CourseContent::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $course);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('CourseContent created successfully.'),
			'data' => new CourseContentResource($courseContent),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Course) além do que o hook de CourseContent recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Course $course): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de CourseContent) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Course $course): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de CourseContent.
	 */
	protected function nestedAfterStore(CourseContent $model, Request $request, Course $course): void
	{
	}

}
