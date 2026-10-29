<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cards;
use App\Http\Requests\CardsRequest;
use App\Http\Resources\CardsCollection;
use App\Http\Resources\CardsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class CardsController extends Controller
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
		$cards = Cards::paginate(15);

		return (new CardsCollection($cards))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CardsRequest $request): JsonResponse
	{
		$cards = Cards::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Cards created successfully.'),
			'data' => new CardsResource($cards),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Cards $cards): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CardsResource($cards),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CardsRequest $request, Cards $cards): JsonResponse
	{
		$cards->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Cards updated successfully.'),
			'data' => new CardsResource($cards),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Cards $cards): Response
	{
		$cards->delete();

		return response()->noContent();
	}

};
