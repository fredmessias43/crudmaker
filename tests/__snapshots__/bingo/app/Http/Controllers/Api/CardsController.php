<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cards;
use App\Http\Requests\CardsRequest;
use App\Http\Resources\CardsCollection;
use App\Http\Resources\CardsResource;


class CardsController extends Controller
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
			$cards = Cards::all();
	
			return response()->json([
				'status' => 200,
				'data' => new CardsCollection($cards),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Cards can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(CardsRequest $request)
	{
		try
		{
			$cards = Cards::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Cards created successfully.'),
				'data' => new CardsResource($cards),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Cards can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Cards $cards)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new CardsResource($cards),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Cards can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(CardsRequest $request, Cards $cards)
	{
		try
		{
			$cards->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Cards updated successfully.'),
				'data' => new CardsResource($cards),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Cards can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Cards $cards)
	{
		try
		{
			$cards->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Cards deleted successfully.'),
				'data' => new CardsResource($cards),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Cards can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
