<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientCollection;
use App\Http\Resources\ClientResource;


class ClientController extends Controller
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
			$client = Client::all();
	
			return response()->json([
				'status' => 200,
				'data' => new ClientCollection($client),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Client can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(ClientRequest $request)
	{
		try
		{
			$client = Client::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Client created successfully.'),
				'data' => new ClientResource($client),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Client can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Client $client)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new ClientResource($client),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Client can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(ClientRequest $request, Client $client)
	{
		try
		{
			$client->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Client updated successfully.'),
				'data' => new ClientResource($client),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Client can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Client $client)
	{
		try
		{
			$client->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Client deleted successfully.'),
				'data' => new ClientResource($client),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Client can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
