<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderCollection;
use App\Http\Resources\OrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class OrderController extends Controller
{

	/**
	 * Display a paginated listing of the resource.
	 *
	 * Responde com o formato de paginação do Laravel: `data`, `links` e `meta`.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function index(): JsonResponse
	{
		$order = Order::paginate(15);

		return (new OrderCollection($order))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\OrderRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(OrderRequest $request): JsonResponse
	{
		$order = Order::create($request->validated());

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
	 * @param  \App\Http\Requests\OrderRequest $request
	 * @param  \App\Models\Order $order
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(OrderRequest $request, Order $order): JsonResponse
	{
		$order->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Order updated successfully.'),
			'data' => new OrderResource($order),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Order $order
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Order $order): Response
	{
		$order->delete();

		return response()->noContent();
	}

};
