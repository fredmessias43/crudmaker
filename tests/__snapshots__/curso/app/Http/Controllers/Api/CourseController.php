<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Http\Requests\CourseRequest;
use App\Http\Resources\CourseCollection;
use App\Http\Resources\CourseResource;


class CourseController extends Controller
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
			$course = Course::all();
	
			return response()->json([
				'status' => 200,
				'data' => new CourseCollection($course),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Course can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(CourseRequest $request)
	{
		try
		{
			$course = Course::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Course created successfully.'),
				'data' => new CourseResource($course),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Course can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Course $course
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Course $course)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new CourseResource($course),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Course can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(CourseRequest $request, Course $course)
	{
		try
		{
			$course->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Course updated successfully.'),
				'data' => new CourseResource($course),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Course can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Course $course
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Course $course)
	{
		try
		{
			$course->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Course deleted successfully.'),
				'data' => new CourseResource($course),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Course can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
