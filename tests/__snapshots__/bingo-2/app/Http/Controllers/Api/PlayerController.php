<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Http\Requests\PlayerRequest;
use App\Http\Resources\PlayerCollection;
use App\Http\Resources\PlayerResource;


class PlayerController extends Controller
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
			$player = Player::all();
	
			return response()->json([
				'status' => 200,
				'data' => new PlayerCollection($player),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Player can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(PlayerRequest $request)
	{
		try
		{
			$player = Player::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Player created successfully.'),
				'data' => new PlayerResource($player),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Player can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Player $player
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Player $player)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new PlayerResource($player),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Player can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(PlayerRequest $request, Player $player)
	{
		try
		{
			$player->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Player updated successfully.'),
				'data' => new PlayerResource($player),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Player can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Player $player
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Player $player)
	{
		try
		{
			$player->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Player deleted successfully.'),
				'data' => new PlayerResource($player),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Player can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
