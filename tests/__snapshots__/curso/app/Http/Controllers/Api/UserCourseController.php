<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCourse;
use App\Http\Requests\UserCourseRequest;
use App\Http\Resources\UserCourseCollection;
use App\Http\Resources\UserCourseResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class UserCourseController extends Controller
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
		$userCourse = UserCourse::paginate(15);

		return (new UserCourseCollection($userCourse))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(UserCourseRequest $request): JsonResponse
	{
		$userCourse = UserCourse::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('UserCourse created successfully.'),
			'data' => new UserCourseResource($userCourse),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(UserCourse $userCourse): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new UserCourseResource($userCourse),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(UserCourseRequest $request, UserCourse $userCourse): JsonResponse
	{
		$userCourse->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('UserCourse updated successfully.'),
			'data' => new UserCourseResource($userCourse),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(UserCourse $userCourse): Response
	{
		$userCourse->delete();

		return response()->noContent();
	}

};
