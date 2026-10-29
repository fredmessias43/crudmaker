<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerInvite;
use App\Http\Requests\PlayerInviteRequest;
use App\Http\Resources\PlayerInviteCollection;
use App\Http\Resources\PlayerInviteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class PlayerInviteController extends Controller
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
		$playerInvite = PlayerInvite::paginate(15);

		return (new PlayerInviteCollection($playerInvite))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(PlayerInviteRequest $request): JsonResponse
	{
		$playerInvite = PlayerInvite::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('PlayerInvite created successfully.'),
			'data' => new PlayerInviteResource($playerInvite),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(PlayerInvite $playerInvite): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new PlayerInviteResource($playerInvite),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(PlayerInviteRequest $request, PlayerInvite $playerInvite): JsonResponse
	{
		$playerInvite->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('PlayerInvite updated successfully.'),
			'data' => new PlayerInviteResource($playerInvite),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(PlayerInvite $playerInvite): Response
	{
		$playerInvite->delete();

		return response()->noContent();
	}

};
