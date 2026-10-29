<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientCollection;
use App\Http\Resources\ClientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClientController extends Controller
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
		$client = Client::paginate(15);

		return (new ClientCollection($client))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClientRequest $request): JsonResponse
	{
		$client = Client::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Client created successfully.'),
			'data' => new ClientResource($client),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Client $client): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClientResource($client),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClientRequest $request, Client $client): JsonResponse
	{
		$client->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Client updated successfully.'),
			'data' => new ClientResource($client),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Client $client): Response
	{
		$client->delete();

		return response()->noContent();
	}

};
