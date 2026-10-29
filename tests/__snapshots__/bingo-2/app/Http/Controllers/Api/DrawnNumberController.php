<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrawnNumber;
use App\Http\Requests\DrawnNumberRequest;
use App\Http\Resources\DrawnNumberCollection;
use App\Http\Resources\DrawnNumberResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class DrawnNumberController extends Controller
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
		$drawnNumber = DrawnNumber::paginate(15);

		return (new DrawnNumberCollection($drawnNumber))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\DrawnNumberRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(DrawnNumberRequest $request): JsonResponse
	{
		$drawnNumber = DrawnNumber::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('DrawnNumber created successfully.'),
			'data' => new DrawnNumberResource($drawnNumber),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(DrawnNumber $drawnNumber): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new DrawnNumberResource($drawnNumber),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\DrawnNumberRequest $request
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(DrawnNumberRequest $request, DrawnNumber $drawnNumber): JsonResponse
	{
		$drawnNumber->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('DrawnNumber updated successfully.'),
			'data' => new DrawnNumberResource($drawnNumber),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\DrawnNumber $drawnNumber
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(DrawnNumber $drawnNumber): Response
	{
		$drawnNumber->delete();

		return response()->noContent();
	}

};
