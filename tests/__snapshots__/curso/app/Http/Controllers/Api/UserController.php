<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserCollection;
use App\Http\Resources\UserResource;


class UserController extends Controller
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
			$user = User::all();
	
			return response()->json([
				'status' => 200,
				'data' => new UserCollection($user),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('User can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\UserRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(UserRequest $request)
	{
		try
		{
			$user = User::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('User created successfully.'),
				'data' => new UserResource($user),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('User can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\User $user
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(User $user)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new UserResource($user),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('User can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\UserRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(UserRequest $request, User $user)
	{
		try
		{
			$user->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('User updated successfully.'),
				'data' => new UserResource($user),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('User can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\User $user
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(User $user)
	{
		try
		{
			$user->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('User deleted successfully.'),
				'data' => new UserResource($user),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('User can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
