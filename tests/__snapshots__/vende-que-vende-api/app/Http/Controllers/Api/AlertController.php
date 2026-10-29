<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Http\Requests\AlertRequest;
use App\Http\Resources\AlertCollection;
use App\Http\Resources\AlertResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class AlertController extends Controller
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
		$alert = Alert::paginate(15);

		return (new AlertCollection($alert))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AlertRequest $request): JsonResponse
	{
		$alert = Alert::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Alert created successfully.'),
			'data' => new AlertResource($alert),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Alert $alert): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AlertResource($alert),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AlertRequest $request, Alert $alert): JsonResponse
	{
		$alert->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Alert updated successfully.'),
			'data' => new AlertResource($alert),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Alert $alert): Response
	{
		$alert->delete();

		return response()->noContent();
	}

};
