<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\OrderItemController (app/Http/Controllers/Api/OrderItemController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Http\Requests\OrderItemRequest;
use App\Http\Resources\OrderItemCollection;
use App\Http\Resources\OrderItemResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseOrderItemController extends Controller
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
		$query = $this->indexQuery(OrderItem::query(), $request);

		return (new OrderItemCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderItemRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(OrderItemRequest $request): JsonResponse
	{
		$orderItem = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = OrderItem::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('OrderItem created successfully.'),
			'data' => new OrderItemResource($orderItem),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\OrderItem $orderItem
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(OrderItem $orderItem): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new OrderItemResource($orderItem),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderItemRequest $request
	 * @param  \App\Models\OrderItem $orderItem
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(OrderItemRequest $request, OrderItem $orderItem): JsonResponse
	{
		DB::transaction(function () use ($request, $orderItem) {
			$data = $this->beforeUpdate($orderItem, $request->validated(), $request);
			$orderItem->update($data);
			$this->afterUpdate($orderItem, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('OrderItem updated successfully.'),
			'data' => new OrderItemResource($orderItem),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\OrderItem $orderItem
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, OrderItem $orderItem): Response
	{
		DB::transaction(function () use ($request, $orderItem) {
			$this->beforeDestroy($orderItem, $request);
			$orderItem->delete();
			$this->afterDestroy($orderItem, $request);
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
	protected function afterStore(OrderItem $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(OrderItem $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(OrderItem $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(OrderItem $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(OrderItem $model, Request $request): void
	{
	}

}
