<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Http\Requests\AlertRequest;
use App\Http\Resources\AlertCollection;
use App\Http\Resources\AlertResource;


class AlertController extends Controller
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
			$alert = Alert::all();
	
			return response()->json([
				'status' => 200,
				'data' => new AlertCollection($alert),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Alert can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(AlertRequest $request)
	{
		try
		{
			$alert = Alert::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Alert created successfully.'),
				'data' => new AlertResource($alert),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Alert can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Alert $alert)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new AlertResource($alert),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Alert can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(AlertRequest $request, Alert $alert)
	{
		try
		{
			$alert->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Alert updated successfully.'),
				'data' => new AlertResource($alert),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Alert can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Alert $alert)
	{
		try
		{
			$alert->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Alert deleted successfully.'),
				'data' => new AlertResource($alert),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Alert can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
