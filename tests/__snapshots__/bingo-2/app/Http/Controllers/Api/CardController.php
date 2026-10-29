<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Http\Requests\CardRequest;
use App\Http\Resources\CardCollection;
use App\Http\Resources\CardResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class CardController extends Controller
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
		$card = Card::paginate(15);

		return (new CardCollection($card))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CardRequest $request): JsonResponse
	{
		$card = Card::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Card created successfully.'),
			'data' => new CardResource($card),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Card $card): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CardResource($card),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CardRequest $request, Card $card): JsonResponse
	{
		$card->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Card updated successfully.'),
			'data' => new CardResource($card),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Card $card): Response
	{
		$card->delete();

		return response()->noContent();
	}

};
