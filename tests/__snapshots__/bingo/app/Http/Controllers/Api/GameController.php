<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Http\Requests\GameRequest;
use App\Http\Resources\GameCollection;
use App\Http\Resources\GameResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class GameController extends Controller
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
		$game = Game::paginate(15);

		return (new GameCollection($game))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(GameRequest $request): JsonResponse
	{
		$game = Game::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Game created successfully.'),
			'data' => new GameResource($game),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Game $game): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new GameResource($game),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(GameRequest $request, Game $game): JsonResponse
	{
		$game->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Game updated successfully.'),
			'data' => new GameResource($game),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Game $game): Response
	{
		$game->delete();

		return response()->noContent();
	}

};
