<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\AwardsController (app/Http/Controllers/Api/AwardsController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Awards;
use App\Http\Requests\AwardsRequest;
use App\Http\Resources\AwardsCollection;
use App\Http\Resources\AwardsResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseAwardsController extends Controller
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
		$query = $this->indexQuery(Awards::query(), $request);

		return (new AwardsCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AwardsRequest $request): JsonResponse
	{
		$awards = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Awards::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Awards created successfully.'),
			'data' => new AwardsResource($awards),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Awards $awards): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AwardsResource($awards),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AwardsRequest $request, Awards $awards): JsonResponse
	{
		DB::transaction(function () use ($request, $awards) {
			$data = $this->beforeUpdate($awards, $request->validated(), $request);
			$awards->update($data);
			$this->afterUpdate($awards, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Awards updated successfully.'),
			'data' => new AwardsResource($awards),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Awards $awards): Response
	{
		DB::transaction(function () use ($request, $awards) {
			$this->beforeDestroy($awards, $request);
			$awards->delete();
			$this->afterDestroy($awards, $request);
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
	protected function afterStore(Awards $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Awards $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Awards $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Awards $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Awards $model, Request $request): void
	{
	}

}
