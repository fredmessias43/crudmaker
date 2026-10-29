<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClassLessonClassLessonCommentController (app/Http/Controllers/Api/Relationships/ClassLessonClassLessonCommentController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\ClassLessonCommentController;
use App\Models\ClassLesson;
use App\Models\ClassLessonComment;
use App\Http\Requests\ClassLessonCommentRequest;
use App\Http\Resources\ClassLessonCommentCollection;
use App\Http\Resources\ClassLessonCommentResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de ClassLesson -> classLessonComments (hasMany).
 *
 * Estende o controller de ClassLessonComment: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClassLessonClassLessonCommentController extends ClassLessonCommentController
{

	/**
	 * Display a paginated listing of the ClassLessonComment records of a ClassLesson.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de ClassLessonComment.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, ClassLesson $classLesson): JsonResponse
	{
		$query = ClassLessonComment::query()->where('class_lesson_id', $classLesson->getKey());

		// Hooks do usuário: primeiro o de ClassLessonComment (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $classLesson);

		return (new ClassLessonCommentCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created ClassLessonComment for a ClassLesson.
	 *
	 * A chave estrangeira ('class_lesson_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(ClassLessonCommentRequest $request, ClassLesson $classLesson): JsonResponse
	{
		$classLessonComment = DB::transaction(function () use ($request, $classLesson) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $classLesson);
			$data['class_lesson_id'] = $classLesson->getKey();

			$model = ClassLessonComment::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $classLesson);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLessonComment created successfully.'),
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (ClassLesson) além do que o hook de ClassLessonComment recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, ClassLesson $classLesson): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de ClassLessonComment) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, ClassLesson $classLesson): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de ClassLessonComment.
	 */
	protected function nestedAfterStore(ClassLessonComment $model, Request $request, ClassLesson $classLesson): void
	{
	}

}
