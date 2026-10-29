<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\DrawnNumberController (app/Http/Controllers/Api/DrawnNumberController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrawnNumber;
use App\Http\Requests\DrawnNumberRequest;
use App\Http\Resources\DrawnNumberCollection;
use App\Http\Resources\DrawnNumberResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseDrawnNumberController extends Controller
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
		$query = $this->indexQuery(DrawnNumber::query(), $request);

		return (new DrawnNumberCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\DrawnNumberRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(DrawnNumberRequest $request): JsonResponse
	{
		$drawnNumber = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = DrawnNumber::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('DrawnNumber created successfully.'),
			'data' => new DrawnNumberResource($drawnNumber),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(DrawnNumber $drawnNumber): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new DrawnNumberResource($drawnNumber),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\DrawnNumberRequest $request
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(DrawnNumberRequest $request, DrawnNumber $drawnNumber): JsonResponse
	{
		DB::transaction(function () use ($request, $drawnNumber) {
			$data = $this->beforeUpdate($drawnNumber, $request->validated(), $request);
			$drawnNumber->update($data);
			$this->afterUpdate($drawnNumber, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('DrawnNumber updated successfully.'),
			'data' => new DrawnNumberResource($drawnNumber),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, DrawnNumber $drawnNumber): Response
	{
		DB::transaction(function () use ($request, $drawnNumber) {
			$this->beforeDestroy($drawnNumber, $request);
			$drawnNumber->delete();
			$this->afterDestroy($drawnNumber, $request);
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
	protected function afterStore(DrawnNumber $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(DrawnNumber $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(DrawnNumber $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(DrawnNumber $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(DrawnNumber $model, Request $request): void
	{
	}

}
