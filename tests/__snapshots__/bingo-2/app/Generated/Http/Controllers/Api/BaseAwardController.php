<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\AwardController (app/Http/Controllers/Api/AwardController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Award;
use App\Http\Requests\AwardRequest;
use App\Http\Resources\AwardCollection;
use App\Http\Resources\AwardResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseAwardController extends Controller
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
		$query = $this->indexQuery(Award::query(), $request);

		return (new AwardCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AwardRequest $request): JsonResponse
	{
		$award = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Award::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Award created successfully.'),
			'data' => new AwardResource($award),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Award $award): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AwardResource($award),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AwardRequest $request, Award $award): JsonResponse
	{
		DB::transaction(function () use ($request, $award) {
			$data = $this->beforeUpdate($award, $request->validated(), $request);
			$award->update($data);
			$this->afterUpdate($award, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Award updated successfully.'),
			'data' => new AwardResource($award),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Award $award): Response
	{
		DB::transaction(function () use ($request, $award) {
			$this->beforeDestroy($award, $request);
			$award->delete();
			$this->afterDestroy($award, $request);
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
	protected function afterStore(Award $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Award $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Award $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Award $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Award $model, Request $request): void
	{
	}

}
