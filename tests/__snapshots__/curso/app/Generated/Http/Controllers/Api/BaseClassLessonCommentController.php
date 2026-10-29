<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\ClassLessonCommentController (app/Http/Controllers/Api/ClassLessonCommentController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLessonComment;
use App\Http\Requests\ClassLessonCommentRequest;
use App\Http\Resources\ClassLessonCommentCollection;
use App\Http\Resources\ClassLessonCommentResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseClassLessonCommentController extends Controller
{

	/**
	 * Display a paginated listing of the resource.
	 *
	 * Responde com o formato de paginação do Laravel: `data`, `links` e `meta`.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function index(Request $request): JsonResponse
	{
		$query = $this->indexQuery(ClassLessonComment::query(), $request);

		return (new ClassLessonCommentCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassLessonCommentRequest $request): JsonResponse
	{
		$classLessonComment = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = ClassLessonComment::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLessonComment created successfully.'),
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(ClassLessonComment $classLessonComment): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassLessonCommentRequest $request, ClassLessonComment $classLessonComment): JsonResponse
	{
		DB::transaction(function () use ($request, $classLessonComment) {
			$data = $this->beforeUpdate($classLessonComment, $request->validated(), $request);
			$classLessonComment->update($data);
			$this->afterUpdate($classLessonComment, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('ClassLessonComment updated successfully.'),
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, ClassLessonComment $classLessonComment): Response
	{
		DB::transaction(function () use ($request, $classLessonComment) {
			$this->beforeDestroy($classLessonComment, $request);
			$classLessonComment->delete();
			$this->afterDestroy($classLessonComment, $request);
		});

		return response()->noContent();
	}


	/*
	 * Hooks. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Para barrar a operação, lance uma exceção ou chame abort(): em store/update/destroy isso desfaz a gravação.
	 */

	/**
	 * Ajusta a query do `index` antes de paginar (filtro por usuário, escopos, ordenação).
	 */
	protected function indexQuery(Builder $query, Request $request): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados e devolve os dados a gravar.
	 */
	protected function beforeStore(array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação): efeitos colaterais com o registro gravado.
	 */
	protected function afterStore(ClassLessonComment $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(ClassLessonComment $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(ClassLessonComment $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(ClassLessonComment $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(ClassLessonComment $model, Request $request): void
	{
	}

}
