<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrawnNumbers;
use App\Http\Requests\DrawnNumbersRequest;
use App\Http\Resources\DrawnNumbersCollection;
use App\Http\Resources\DrawnNumbersResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class DrawnNumbersController extends Controller
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
		$drawnNumbers = DrawnNumbers::paginate(15);

		return (new DrawnNumbersCollection($drawnNumbers))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\DrawnNumbersRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(DrawnNumbersRequest $request): JsonResponse
	{
		$drawnNumbers = DrawnNumbers::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('DrawnNumbers created successfully.'),
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(DrawnNumbers $drawnNumbers): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\DrawnNumbersRequest $request
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(DrawnNumbersRequest $request, DrawnNumbers $drawnNumbers): JsonResponse
	{
		$drawnNumbers->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('DrawnNumbers updated successfully.'),
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\DrawnNumbers $drawnNumbers
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(DrawnNumbers $drawnNumbers): Response
	{
		$drawnNumbers->delete();

		return response()->noContent();
	}

};
