<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseCollection;
use App\Http\Resources\CourseResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class CourseController extends Controller
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
		$course = Course::paginate(15);

		return (new CourseCollection($course))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CourseRequest $request): JsonResponse
	{
		$course = Course::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Course created successfully.'),
			'data' => new CourseResource($course),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Course $course
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Course $course): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CourseResource($course),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseRequest $request
	 * @param  \App\Models\Course $course
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CourseRequest $request, Course $course): JsonResponse
	{
		$course->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Course updated successfully.'),
			'data' => new CourseResource($course),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Course $course
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Course $course): Response
	{
		$course->delete();

		return response()->noContent();
	}

};
