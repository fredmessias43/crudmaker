<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassLessonComment;
use App\Http\Requests\ClassLessonCommentRequest;
use App\Http\Resources\ClassLessonCommentCollection;
use App\Http\Resources\ClassLessonCommentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class ClassLessonCommentController extends Controller
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
		$classLessonComment = ClassLessonComment::paginate(15);

		return (new ClassLessonCommentCollection($classLessonComment))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClassLessonCommentRequest $request): JsonResponse
	{
		$classLessonComment = ClassLessonComment::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('ClassLessonComment created successfully.'),
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(ClassLessonComment $classLessonComment): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassLessonCommentRequest $request
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClassLessonCommentRequest $request, ClassLessonComment $classLessonComment): JsonResponse
	{
		$classLessonComment->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('ClassLessonComment updated successfully.'),
			'data' => new ClassLessonCommentResource($classLessonComment),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\ClassLessonComment $classLessonComment
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(ClassLessonComment $classLessonComment): Response
	{
		$classLessonComment->delete();

		return response()->noContent();
	}

};
