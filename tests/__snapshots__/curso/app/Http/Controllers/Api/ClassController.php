<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Class;
use App\Http\Requests\ClassRequest;
use App\Http\Resources\ClassCollection;
use App\Http\Resources\ClassResource;


class ClassController extends Controller
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
			$class = Class::all();
	
			return response()->json([
				'status' => 200,
				'data' => new ClassCollection($class),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Class can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(ClassRequest $request)
	{
		try
		{
			$class = Class::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Class created successfully.'),
				'data' => new ClassResource($class),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Class can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Class $class
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Class $class)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new ClassResource($class),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Class can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\ClassRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(ClassRequest $request, Class $class)
	{
		try
		{
			$class->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Class updated successfully.'),
				'data' => new ClassResource($class),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Class can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Class $class
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Class $class)
	{
		try
		{
			$class->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Class deleted successfully.'),
				'data' => new ClassResource($class),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Class can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
