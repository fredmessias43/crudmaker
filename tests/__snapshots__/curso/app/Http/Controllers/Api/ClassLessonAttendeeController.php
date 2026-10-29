<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLessonAttendee;
use App\Http\Requests\ClassLessonAttendeeRequest;
use App\Http\Resources\ClassLessonAttendeeCollection;
use App\Http\Resources\ClassLessonAttendeeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClassLessonAttendeeController extends Controller
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
		$classLessonAttendee = ClassLessonAttendee::paginate(15);

		return (new ClassLessonAttendeeCollection($classLessonAttendee))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonAttendeeRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassLessonAttendeeRequest $request): JsonResponse
	{
		$classLessonAttendee = ClassLessonAttendee::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLessonAttendee created successfully.'),
			'data' => new ClassLessonAttendeeResource($classLessonAttendee),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLessonAttendee $classLessonAttendee
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(ClassLessonAttendee $classLessonAttendee): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassLessonAttendeeResource($classLessonAttendee),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonAttendeeRequest $request
	 * @param  \App\Models\ClassLessonAttendee $classLessonAttendee
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassLessonAttendeeRequest $request, ClassLessonAttendee $classLessonAttendee): JsonResponse
	{
		$classLessonAttendee->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('ClassLessonAttendee updated successfully.'),
			'data' => new ClassLessonAttendeeResource($classLessonAttendee),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLessonAttendee $classLessonAttendee
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLessonAttendee $classLessonAttendee): Response
	{
		$classLessonAttendee->delete();

		return response()->noContent();
	}

};
