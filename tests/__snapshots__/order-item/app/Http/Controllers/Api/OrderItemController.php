<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Http\Requests\OrderItemRequest;
use App\Http\Resources\OrderItemCollection;
use App\Http\Resources\OrderItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class OrderItemController extends Controller
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
		$orderItem = OrderItem::paginate(15);

		return (new OrderItemCollection($orderItem))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\OrderItemRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(OrderItemRequest $request): JsonResponse
	{
		$orderItem = OrderItem::create($request->validated());

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
	 * @param  \App\Http\Requests\OrderItemRequest $request
	 * @param  \App\Models\OrderItem $orderItem
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(OrderItemRequest $request, OrderItem $orderItem): JsonResponse
	{
		$orderItem->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('OrderItem updated successfully.'),
			'data' => new OrderItemResource($orderItem),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\OrderItem $orderItem
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(OrderItem $orderItem): Response
	{
		$orderItem->delete();

		return response()->noContent();
	}

};
