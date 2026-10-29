<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Class;
use App\Http\Requests\ClassRequest;
use App\Http\Resources\ClassCollection;
use App\Http\Resources\ClassResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClassController extends Controller
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
		$class = Class::paginate(15);

		return (new ClassCollection($class))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassRequest $request): JsonResponse
	{
		$class = Class::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Class created successfully.'),
			'data' => new ClassResource($class),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Class $class
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Class $class): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassResource($class),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassRequest $request
	 * @param  \App\Models\Class $class
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassRequest $request, Class $class): JsonResponse
	{
		$class->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Class updated successfully.'),
			'data' => new ClassResource($class),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Class $class
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Class $class): Response
	{
		$class->delete();

		return response()->noContent();
	}

};
