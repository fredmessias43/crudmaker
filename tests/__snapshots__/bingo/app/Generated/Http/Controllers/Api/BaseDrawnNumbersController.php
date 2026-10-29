<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\DrawnNumbersController (app/Http/Controllers/Api/DrawnNumbersController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrawnNumbers;
use App\Http\Requests\DrawnNumbersRequest;
use App\Http\Resources\DrawnNumbersCollection;
use App\Http\Resources\DrawnNumbersResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseDrawnNumbersController extends Controller
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
		$query = $this->indexQuery(DrawnNumbers::query(), $request);

		return (new DrawnNumbersCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\DrawnNumbersRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(DrawnNumbersRequest $request): JsonResponse
	{
		$drawnNumbers = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = DrawnNumbers::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('DrawnNumbers created successfully.'),
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(DrawnNumbers $drawnNumbers): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\DrawnNumbersRequest $request
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(DrawnNumbersRequest $request, DrawnNumbers $drawnNumbers): JsonResponse
	{
		DB::transaction(function () use ($request, $drawnNumbers) {
			$data = $this->beforeUpdate($drawnNumbers, $request->validated(), $request);
			$drawnNumbers->update($data);
			$this->afterUpdate($drawnNumbers, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('DrawnNumbers updated successfully.'),
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, DrawnNumbers $drawnNumbers): Response
	{
		DB::transaction(function () use ($request, $drawnNumbers) {
			$this->beforeDestroy($drawnNumbers, $request);
			$drawnNumbers->delete();
			$this->afterDestroy($drawnNumbers, $request);
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
	protected function afterStore(DrawnNumbers $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(DrawnNumbers $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(DrawnNumbers $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(DrawnNumbers $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(DrawnNumbers $model, Request $request): void
	{
	}

}
