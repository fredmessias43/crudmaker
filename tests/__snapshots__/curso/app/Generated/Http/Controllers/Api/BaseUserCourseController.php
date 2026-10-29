<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\UserCourseController (app/Http/Controllers/Api/UserCourseController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCourse;
use App\Http\Requests\UserCourseRequest;
use App\Http\Resources\UserCourseCollection;
use App\Http\Resources\UserCourseResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseUserCourseController extends Controller
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
		$query = $this->indexQuery(UserCourse::query(), $request);

		return (new UserCourseCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(UserCourseRequest $request): JsonResponse
	{
		$userCourse = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = UserCourse::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('UserCourse created successfully.'),
			'data' => new UserCourseResource($userCourse),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(UserCourse $userCourse): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new UserCourseResource($userCourse),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(UserCourseRequest $request, UserCourse $userCourse): JsonResponse
	{
		DB::transaction(function () use ($request, $userCourse) {
			$data = $this->beforeUpdate($userCourse, $request->validated(), $request);
			$userCourse->update($data);
			$this->afterUpdate($userCourse, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('UserCourse updated successfully.'),
			'data' => new UserCourseResource($userCourse),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, UserCourse $userCourse): Response
	{
		DB::transaction(function () use ($request, $userCourse) {
			$this->beforeDestroy($userCourse, $request);
			$userCourse->delete();
			$this->afterDestroy($userCourse, $request);
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
	protected function afterStore(UserCourse $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(UserCourse $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(UserCourse $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(UserCourse $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(UserCourse $model, Request $request): void
	{
	}

}
