<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserCollection;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class UserController extends Controller
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
		$user = User::paginate(15);

		return (new UserCollection($user))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\UserRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(UserRequest $request): JsonResponse
	{
		$user = User::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('User created successfully.'),
			'data' => new UserResource($user),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\User $user
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(User $user): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new UserResource($user),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\UserRequest $request
	 * @param  \App\Models\User $user
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(UserRequest $request, User $user): JsonResponse
	{
		$user->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('User updated successfully.'),
			'data' => new UserResource($user),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\User $user
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(User $user): Response
	{
		$user->delete();

		return response()->noContent();
	}

};
