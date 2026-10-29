<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLessonAttendee;
use App\Http\Requests\ClassLessonAttendeeRequest;
use App\Http\Resources\ClassLessonAttendeeCollection;
use App\Http\Resources\ClassLessonAttendeeResource;


class ClassLessonAttendeeController extends Controller
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
			$classLessonAttendee = ClassLessonAttendee::all();
	
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonAttendeeCollection($classLessonAttendee),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonAttendee can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonAttendeeRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(ClassLessonAttendeeRequest $request)
	{
		try
		{
			$classLessonAttendee = ClassLessonAttendee::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLessonAttendee created successfully.'),
				'data' => new ClassLessonAttendeeResource($classLessonAttendee),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLessonAttendee can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLessonAttendee $classLessonAttendee
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(ClassLessonAttendee $classLessonAttendee)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonAttendeeResource($classLessonAttendee),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonAttendee can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonAttendeeRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(ClassLessonAttendeeRequest $request, ClassLessonAttendee $classLessonAttendee)
	{
		try
		{
			$classLessonAttendee->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLessonAttendee updated successfully.'),
				'data' => new ClassLessonAttendeeResource($classLessonAttendee),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLessonAttendee can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLessonAttendee $classLessonAttendee
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLessonAttendee $classLessonAttendee)
	{
		try
		{
			$classLessonAttendee->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('ClassLessonAttendee deleted successfully.'),
				'data' => new ClassLessonAttendeeResource($classLessonAttendee),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonAttendee can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
