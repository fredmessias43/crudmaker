<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLessonComment;
use App\Http\Requests\ClassLessonCommentRequest;
use App\Http\Resources\ClassLessonCommentCollection;
use App\Http\Resources\ClassLessonCommentResource;


class ClassLessonCommentController extends Controller
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
			$classLessonComment = ClassLessonComment::all();
	
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonCommentCollection($classLessonComment),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonComment can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(ClassLessonCommentRequest $request)
	{
		try
		{
			$classLessonComment = ClassLessonComment::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLessonComment created successfully.'),
				'data' => new ClassLessonCommentResource($classLessonComment),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLessonComment can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(ClassLessonComment $classLessonComment)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new ClassLessonCommentResource($classLessonComment),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonComment can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(ClassLessonCommentRequest $request, ClassLessonComment $classLessonComment)
	{
		try
		{
			$classLessonComment->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('ClassLessonComment updated successfully.'),
				'data' => new ClassLessonCommentResource($classLessonComment),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('ClassLessonComment can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLessonComment $classLessonComment)
	{
		try
		{
			$classLessonComment->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('ClassLessonComment deleted successfully.'),
				'data' => new ClassLessonCommentResource($classLessonComment),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('ClassLessonComment can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
