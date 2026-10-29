<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Award;
use App\Http\Requests\AwardRequest;
use App\Http\Resources\AwardCollection;
use App\Http\Resources\AwardResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class AwardController extends Controller
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
		$award = Award::paginate(15);

		return (new AwardCollection($award))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AwardRequest $request): JsonResponse
	{
		$award = Award::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Award created successfully.'),
			'data' => new AwardResource($award),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Award $award): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AwardResource($award),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AwardRequest $request, Award $award): JsonResponse
	{
		$award->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Award updated successfully.'),
			'data' => new AwardResource($award),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Award $award
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Award $award): Response
	{
		$award->delete();

		return response()->noContent();
	}

};
