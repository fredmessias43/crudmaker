<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressCollection;
use App\Http\Resources\AddressResource;


class AddressController extends Controller
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
			$address = Address::all();
	
			return response()->json([
				'status' => 200,
				'data' => new AddressCollection($address),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Address can not be listed.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store(AddressRequest $request)
	{
		try
		{
			$address = Address::create($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Address created successfully.'),
				'data' => new AddressResource($address),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Address can not be created.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function show(Address $address)
	{
		try
		{
			return response()->json([
				'status' => 200,
				'data' => new AddressResource($address),
			], 200);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Address can not be shown.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function update(AddressRequest $request, Address $address)
	{
		try
		{
			$address->update($request->validated());
	
			return response()->json([
				'status' => 201,
				'message' => trans('Address updated successfully.'),
				'data' => new AddressResource($address),
			], 201);
		}
		catch (\Throwable $th)
		{
			throw new \Exception('Address can not be updated.' . $th->getMessage(), 500);
		}
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Address $address)
	{
		try
		{
			$address->delete();
	
			return response()->json([
				'status' => 204,
				'message' => trans('Address deleted successfully.'),
				'data' => new AddressResource($address),
			], 204);
		}
		catch(\Throwable $th)
		{
			throw new \Exception('Address can not be deleted.' . $th->getMessage(), 500);
		}
	}

};
