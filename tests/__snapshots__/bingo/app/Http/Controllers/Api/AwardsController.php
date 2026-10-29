<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Awards;
use App\Http\Requests\AwardsRequest;
use App\Http\Resources\AwardsCollection;
use App\Http\Resources\AwardsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class AwardsController extends Controller
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
		$awards = Awards::paginate(15);

		return (new AwardsCollection($awards))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AwardsRequest $request): JsonResponse
	{
		$awards = Awards::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Awards created successfully.'),
			'data' => new AwardsResource($awards),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Awards $awards): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AwardsResource($awards),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardsRequest $request
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AwardsRequest $request, Awards $awards): JsonResponse
	{
		$awards->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Awards updated successfully.'),
			'data' => new AwardsResource($awards),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Awards $awards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Awards $awards): Response
	{
		$awards->delete();

		return response()->noContent();
	}

};
