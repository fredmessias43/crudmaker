<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Http\Requests\PlayerRequest;
use App\Http\Resources\PlayerCollection;
use App\Http\Resources\PlayerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class PlayerController extends Controller
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
		$player = Player::paginate(15);

		return (new PlayerCollection($player))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(PlayerRequest $request): JsonResponse
	{
		$player = Player::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Player created successfully.'),
			'data' => new PlayerResource($player),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Player $player
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Player $player): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new PlayerResource($player),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerRequest $request
	 * @param  \App\Models\Player $player
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(PlayerRequest $request, Player $player): JsonResponse
	{
		$player->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Player updated successfully.'),
			'data' => new PlayerResource($player),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Player $player
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Player $player): Response
	{
		$player->delete();

		return response()->noContent();
	}

};
