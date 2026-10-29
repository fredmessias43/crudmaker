<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Http\Requests\NoteRequest;
use App\Http\Resources\NoteCollection;
use App\Http\Resources\NoteResource;


class NoteController extends Controller
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
			$note = Note::all();
	
			return response()->json([
				'status' => 200,
				'data' => new NoteCollection($note),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Note can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(NoteRequest $request)
	{
		try
		{
			$note = Note::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Note created successfully.'),
				'data' => new NoteResource($note),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Note can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Note $note)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new NoteResource($note),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Note can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(NoteRequest $request, Note $note)
	{
		try
		{
			$note->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Note updated successfully.'),
				'data' => new NoteResource($note),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Note can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Note $note)
	{
		try
		{
			$note->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Note deleted successfully.'),
				'data' => new NoteResource($note),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Note can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
