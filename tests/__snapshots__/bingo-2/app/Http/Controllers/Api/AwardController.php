<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Award;
use App\Http\Requests\AwardRequest;
use App\Http\Resources\AwardCollection;
use App\Http\Resources\AwardResource;


class AwardController extends Controller
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
			$award = Award::all();
	
			return response()->json([
				'status' => 200,
				'data' => new AwardCollection($award),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Award can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(AwardRequest $request)
	{
		try
		{
			$award = Award::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Award created successfully.'),
				'data' => new AwardResource($award),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Award can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Award $award)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new AwardResource($award),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Award can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(AwardRequest $request, Award $award)
	{
		try
		{
			$award->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Award updated successfully.'),
				'data' => new AwardResource($award),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Award can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Award $award)
	{
		try
		{
			$award->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Award deleted successfully.'),
				'data' => new AwardResource($award),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Award can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
