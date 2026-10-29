<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentCollection;
use App\Http\Resources\StudentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class StudentController extends Controller
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
		$student = Student::paginate(15);

		return (new StudentCollection($student))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\StudentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(StudentRequest $request): JsonResponse
	{
		$student = Student::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Student created successfully.'),
			'data' => new StudentResource($student),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Student $student
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Student $student): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new StudentResource($student),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\StudentRequest $request
	 * @param  \App\Models\Student $student
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(StudentRequest $request, Student $student): JsonResponse
	{
		$student->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Student updated successfully.'),
			'data' => new StudentResource($student),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Student $student
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Student $student): Response
	{
		$student->delete();

		return response()->noContent();
	}

};
