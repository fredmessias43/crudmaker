<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerInvite;
use App\Http\Requests\PlayerInviteRequest;
use App\Http\Resources\PlayerInviteCollection;
use App\Http\Resources\PlayerInviteResource;


class PlayerInviteController extends Controller
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
			$playerInvite = PlayerInvite::all();
	
			return response()->json([
				'status' => 200,
				'data' => new PlayerInviteCollection($playerInvite),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('PlayerInvite can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(PlayerInviteRequest $request)
	{
		try
		{
			$playerInvite = PlayerInvite::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('PlayerInvite created successfully.'),
				'data' => new PlayerInviteResource($playerInvite),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('PlayerInvite can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(PlayerInvite $playerInvite)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new PlayerInviteResource($playerInvite),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('PlayerInvite can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(PlayerInviteRequest $request, PlayerInvite $playerInvite)
	{
		try
		{
			$playerInvite->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('PlayerInvite updated successfully.'),
				'data' => new PlayerInviteResource($playerInvite),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('PlayerInvite can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(PlayerInvite $playerInvite)
	{
		try
		{
			$playerInvite->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('PlayerInvite deleted successfully.'),
				'data' => new PlayerInviteResource($playerInvite),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('PlayerInvite can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
