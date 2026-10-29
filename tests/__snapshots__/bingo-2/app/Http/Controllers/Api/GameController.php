<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Http\Requests\GameRequest;
use App\Http\Resources\GameCollection;
use App\Http\Resources\GameResource;


class GameController extends Controller
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
			$game = Game::all();
	
			return response()->json([
				'status' => 200,
				'data' => new GameCollection($game),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Game can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(GameRequest $request)
	{
		try
		{
			$game = Game::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Game created successfully.'),
				'data' => new GameResource($game),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Game can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Game $game)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new GameResource($game),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Game can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(GameRequest $request, Game $game)
	{
		try
		{
			$game->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Game updated successfully.'),
				'data' => new GameResource($game),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Game can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Game $game)
	{
		try
		{
			$game->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Game deleted successfully.'),
				'data' => new GameResource($game),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Game can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
