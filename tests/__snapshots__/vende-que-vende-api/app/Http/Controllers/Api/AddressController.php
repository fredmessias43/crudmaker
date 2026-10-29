<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressCollection;
use App\Http\Resources\AddressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;


class AddressController extends Controller
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
		$address = Address::paginate(15);

		return (new AddressCollection($address))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AddressRequest $request): JsonResponse
	{
		$address = Address::create($request->validated());

		return response()->json([
			'status' => 201,
			'message' => trans('Address created successfully.'),
			'data' => new AddressResource($address),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Address $address): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AddressResource($address),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AddressRequest $request, Address $address): JsonResponse
	{
		$address->update($request->validated());

		return response()->json([
			'status' => 200,
			'message' => trans('Address updated successfully.'),
			'data' => new AddressResource($address),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Address $address): Response
	{
		$address->delete();

		return response()->noContent();
	}

};
