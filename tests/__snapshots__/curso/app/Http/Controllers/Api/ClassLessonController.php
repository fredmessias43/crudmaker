<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLesson;
use App\Http\Requests\ClassLessonRequest;
use App\Http\Resources\ClassLessonCollection;
use App\Http\Resources\ClassLessonResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClassLessonController extends Controller
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
		$classLesson = ClassLesson::paginate(15);

		return (new ClassLessonCollection($classLesson))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassLessonRequest $request): JsonResponse
	{
		$classLesson = ClassLesson::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLesson created successfully.'),
			'data' => new ClassLessonResource($classLesson),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(ClassLesson $classLesson): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassLessonResource($classLesson),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassLessonRequest $request, ClassLesson $classLesson): JsonResponse
	{
		$classLesson->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('ClassLesson updated successfully.'),
			'data' => new ClassLessonResource($classLesson),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLesson $classLesson): Response
	{
		$classLesson->delete();

		return response()->noContent();
	}

};
