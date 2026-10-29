<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCourse;
use App\Http\Requests\UserCourseRequest;
use App\Http\Resources\UserCourseCollection;
use App\Http\Resources\UserCourseResource;


class UserCourseController extends Controller
{

	/**
	 * Display a listing of the resource.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		try
		{
			$userCourse = UserCourse::all();
	
			return response()->json([
				'status' => 200,
				'data' => new UserCourseCollection($userCourse),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('UserCourse can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(UserCourseRequest $request)
	{
		try
		{
			$userCourse = UserCourse::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('UserCourse created successfully.'),
				'data' => new UserCourseResource($userCourse),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('UserCourse can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(UserCourse $userCourse)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new UserCourseResource($userCourse),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('UserCourse can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(UserCourseRequest $request, UserCourse $userCourse)
	{
		try
		{
			$userCourse->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('UserCourse updated successfully.'),
				'data' => new UserCourseResource($userCourse),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('UserCourse can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\UserCourse $userCourse
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(UserCourse $userCourse)
	{
		try
		{
			$userCourse->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('UserCourse deleted successfully.'),
				'data' => new UserCourseResource($userCourse),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('UserCourse can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
