<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Classroom;
use App\Http\Requests\ClassroomRequest;
use App\Http\Resources\ClassroomCollection;
use App\Http\Resources\ClassroomResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClassroomController extends Controller
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
		$classroom = Classroom::paginate(15);

		return (new ClassroomCollection($classroom))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassroomRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassroomRequest $request): JsonResponse
	{
		$classroom = Classroom::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Classroom created successfully.'),
			'data' => new ClassroomResource($classroom),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Classroom $classroom
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Classroom $classroom): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassroomResource($classroom),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassroomRequest $request
	 * @param  \App\Models\Classroom $classroom
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassroomRequest $request, Classroom $classroom): JsonResponse
	{
		$classroom->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Classroom updated successfully.'),
			'data' => new ClassroomResource($classroom),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Classroom $classroom
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Classroom $classroom): Response
	{
		$classroom->delete();

		return response()->noContent();
	}

};
