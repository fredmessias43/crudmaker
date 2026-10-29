<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Awards;
use App\Http\Requests\AwardsRequest;
use App\Http\Resources\AwardsCollection;
use App\Http\Resources\AwardsResource;


class AwardsController extends Controller
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
			$awards = Awards::all();
	
			return response()->json([
				'status' => 200,
				'data' => new AwardsCollection($awards),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Awards can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(AwardsRequest $request)
	{
		try
		{
			$awards = Awards::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Awards created successfully.'),
				'data' => new AwardsResource($awards),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Awards can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Awards $awards)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new AwardsResource($awards),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Awards can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(AwardsRequest $request, Awards $awards)
	{
		try
		{
			$awards->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Awards updated successfully.'),
				'data' => new AwardsResource($awards),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Awards can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Awards $awards)
	{
		try
		{
			$awards->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Awards deleted successfully.'),
				'data' => new AwardsResource($awards),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Awards can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
