<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Http\Requests\CardRequest;
use App\Http\Resources\CardCollection;
use App\Http\Resources\CardResource;


class CardController extends Controller
{

	/**
	 * Display a listing of the resource.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		try
		{
			$card = Card::all();
	
			return response()->json([
				'status' => 200,
				'data' => new CardCollection($card),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Card can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(CardRequest $request)
	{
		try
		{
			$card = Card::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Card created successfully.'),
				'data' => new CardResource($card),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Card can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Card $card)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new CardResource($card),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Card can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(CardRequest $request, Card $card)
	{
		try
		{
			$card->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Card updated successfully.'),
				'data' => new CardResource($card),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Card can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Card $card)
	{
		try
		{
			$card->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Card deleted successfully.'),
				'data' => new CardResource($card),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Card can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
