<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentCollection;
use App\Http\Resources\StudentResource;


class StudentController extends Controller
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
			$student = Student::all();
	
			return response()->json([
				'status' => 200,
				'data' => new StudentCollection($student),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Student can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\StudentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(StudentRequest $request)
	{
		try
		{
			$student = Student::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Student created successfully.'),
				'data' => new StudentResource($student),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Student can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Student $student
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Student $student)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new StudentResource($student),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Student can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\StudentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(StudentRequest $request, Student $student)
	{
		try
		{
			$student->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Student updated successfully.'),
				'data' => new StudentResource($student),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Student can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Student $student
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Student $student)
	{
		try
		{
			$student->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Student deleted successfully.'),
				'data' => new StudentResource($student),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Student can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
