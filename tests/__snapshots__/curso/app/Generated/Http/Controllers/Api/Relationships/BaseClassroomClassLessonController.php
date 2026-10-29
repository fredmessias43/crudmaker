<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClassroomClassLessonController (app/Http/Controllers/Api/Relationships/ClassroomClassLessonController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\ClassLessonController;
use App\Models\Classroom;
use App\Models\ClassLesson;
use App\Http\Requests\ClassLessonRequest;
use App\Http\Resources\ClassLessonCollection;
use App\Http\Resources\ClassLessonResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Classroom -> classLessons (hasMany).
 *
 * Estende o controller de ClassLesson: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClassroomClassLessonController extends ClassLessonController
{

	/**
	 * Display a paginated listing of the ClassLesson records of a Classroom.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de ClassLesson.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Classroom $classroom): JsonResponse
	{
		$query = ClassLesson::query()->where('classroom_id', $classroom->getKey());

		// Hooks do usuário: primeiro o de ClassLesson (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $classroom);

		return (new ClassLessonCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created ClassLesson for a Classroom.
	 *
	 * A chave estrangeira ('classroom_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(ClassLessonRequest $request, Classroom $classroom): JsonResponse
	{
		$classLesson = DB::transaction(function () use ($request, $classroom) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $classroom);
			$data['classroom_id'] = $classroom->getKey();

			$model = ClassLesson::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $classroom);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLesson created successfully.'),
			'data' => new ClassLessonResource($classLesson),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Classroom) além do que o hook de ClassLesson recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Classroom $classroom): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de ClassLesson) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Classroom $classroom): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de ClassLesson.
	 */
	protected function nestedAfterStore(ClassLesson $model, Request $request, Classroom $classroom): void
	{
	}

}
