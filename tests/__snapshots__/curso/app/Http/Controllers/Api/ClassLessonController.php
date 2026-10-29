<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLesson;
use App\Http\Requests\ClassLessonRequest;
use App\Http\Resources\ClassLessonCollection;
use App\Http\Resources\ClassLessonResource;


class ClassLessonController extends Controller
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
			$classLesson = ClassLesson::all();
	
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonCollection($classLesson),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLesson can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(ClassLessonRequest $request)
	{
		try
		{
			$classLesson = ClassLesson::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLesson created successfully.'),
				'data' => new ClassLessonResource($classLesson),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLesson can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(ClassLesson $classLesson)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonResource($classLesson),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLesson can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(ClassLessonRequest $request, ClassLesson $classLesson)
	{
		try
		{
			$classLesson->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLesson updated successfully.'),
				'data' => new ClassLessonResource($classLesson),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLesson can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLesson $classLesson
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLesson $classLesson)
	{
		try
		{
			$classLesson->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('ClassLesson deleted successfully.'),
				'data' => new ClassLessonResource($classLesson),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLesson can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
