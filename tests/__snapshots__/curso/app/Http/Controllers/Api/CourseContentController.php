<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseContent;
use App\Http\Requests\CourseContentRequest;
use App\Http\Resources\CourseContentCollection;
use App\Http\Resources\CourseContentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class CourseContentController extends Controller
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
		$courseContent = CourseContent::paginate(15);

		return (new CourseContentCollection($courseContent))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseContentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CourseContentRequest $request): JsonResponse
	{
		$courseContent = CourseContent::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('CourseContent created successfully.'),
			'data' => new CourseContentResource($courseContent),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\CourseContent $courseContent
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(CourseContent $courseContent): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CourseContentResource($courseContent),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseContentRequest $request
	 * @param  \App\Models\CourseContent $courseContent
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CourseContentRequest $request, CourseContent $courseContent): JsonResponse
	{
		$courseContent->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('CourseContent updated successfully.'),
			'data' => new CourseContentResource($courseContent),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\CourseContent $courseContent
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(CourseContent $courseContent): Response
	{
		$courseContent->delete();

		return response()->noContent();
	}

};
