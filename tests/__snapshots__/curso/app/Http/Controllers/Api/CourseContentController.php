<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseContent;
use App\Http\Requests\CourseContentRequest;
use App\Http\Resources\CourseContentCollection;
use App\Http\Resources\CourseContentResource;


class CourseContentController extends Controller
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
			$courseContent = CourseContent::all();
	
			return response()->json([
				'status' => 200,
				'data' => new CourseContentCollection($courseContent),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('CourseContent can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseContentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(CourseContentRequest $request)
	{
		try
		{
			$courseContent = CourseContent::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('CourseContent created successfully.'),
				'data' => new CourseContentResource($courseContent),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('CourseContent can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\CourseContent $courseContent
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(CourseContent $courseContent)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new CourseContentResource($courseContent),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('CourseContent can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\CourseContentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(CourseContentRequest $request, CourseContent $courseContent)
	{
		try
		{
			$courseContent->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('CourseContent updated successfully.'),
				'data' => new CourseContentResource($courseContent),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('CourseContent can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\CourseContent $courseContent
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(CourseContent $courseContent)
	{
		try
		{
			$courseContent->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('CourseContent deleted successfully.'),
				'data' => new CourseContentResource($courseContent),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('CourseContent can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
