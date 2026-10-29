<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\ClassLessonController (app/Http/Controllers/Api/ClassLessonController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLesson;
use App\Http\Requests\ClassLessonRequest;
use App\Http\Resources\ClassLessonCollection;
use App\Http\Resources\ClassLessonResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseClassLessonController extends Controller
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
		$query = $this->indexQuery(ClassLesson::query(), $request);

		return (new ClassLessonCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassLessonRequest $request): JsonResponse
	{
		$classLesson = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = ClassLesson::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLesson created successfully.'),
			'data' => new ClassLessonResource($classLesson),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(ClassLesson $classLesson): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassLessonResource($classLesson),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassLessonRequest $request, ClassLesson $classLesson): JsonResponse
	{
		DB::transaction(function () use ($request, $classLesson) {
			$data = $this->beforeUpdate($classLesson, $request->validated(), $request);
			$classLesson->update($data);
			$this->afterUpdate($classLesson, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('ClassLesson updated successfully.'),
			'data' => new ClassLessonResource($classLesson),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, ClassLesson $classLesson): Response
	{
		DB::transaction(function () use ($request, $classLesson) {
			$this->beforeDestroy($classLesson, $request);
			$classLesson->delete();
			$this->afterDestroy($classLesson, $request);
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
	protected function afterStore(ClassLesson $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(ClassLesson $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(ClassLesson $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(ClassLesson $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(ClassLesson $model, Request $request): void
	{
	}

}
