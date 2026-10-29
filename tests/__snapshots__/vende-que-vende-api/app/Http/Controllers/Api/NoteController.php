<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Http\Requests\NoteRequest;
use App\Http\Resources\NoteCollection;
use App\Http\Resources\NoteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class NoteController extends Controller
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
		$note = Note::paginate(15);

		return (new NoteCollection($note))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(NoteRequest $request): JsonResponse
	{
		$note = Note::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Note created successfully.'),
			'data' => new NoteResource($note),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Note $note): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new NoteResource($note),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(NoteRequest $request, Note $note): JsonResponse
	{
		$note->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Note updated successfully.'),
			'data' => new NoteResource($note),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Note $note): Response
	{
		$note->delete();

		return response()->noContent();
	}

};
