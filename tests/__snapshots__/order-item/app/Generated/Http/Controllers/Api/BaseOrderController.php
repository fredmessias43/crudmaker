<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\OrderController (app/Http/Controllers/Api/OrderController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseOrderController extends Controller
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
		$query = $this->indexQuery(Order::query(), $request);

		return (new OrderCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(OrderRequest $request): JsonResponse
	{
		$order = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Order::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Order created successfully.'),
			'data' => new OrderResource($order),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Order $order
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Order $order): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new OrderResource($order),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderRequest $request
	 * @param  \App\Models\Order $order
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(OrderRequest $request, Order $order): JsonResponse
	{
		DB::transaction(function () use ($request, $order) {
			$data = $this->beforeUpdate($order, $request->validated(), $request);
			$order->update($data);
			$this->afterUpdate($order, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Order updated successfully.'),
			'data' => new OrderResource($order),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Order $order
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Order $order): Response
	{
		DB::transaction(function () use ($request, $order) {
			$this->beforeDestroy($order, $request);
			$order->delete();
			$this->afterDestroy($order, $request);
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
	protected function afterStore(Order $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Order $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Order $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Order $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Order $model, Request $request): void
	{
	}

}
