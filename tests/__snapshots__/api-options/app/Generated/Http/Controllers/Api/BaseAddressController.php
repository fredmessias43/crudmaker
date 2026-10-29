<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\AddressController (app/Http/Controllers/Api/AddressController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressCollection;
use App\Http\Resources\AddressResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseAddressController extends Controller
{

	/**
	 * Display a paginated listing of the resource.
	 *
	 * Responde com o formato de paginação do Laravel: `data`, `links` e `meta`.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function index(Request $request): JsonResponse
	{
		$query = $this->indexQuery(Address::query(), $request);

		return (new AddressCollection($query->paginate(25)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AddressRequest $request): JsonResponse
	{
		$address = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Address::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

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
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AddressRequest $request, Address $address): JsonResponse
	{
		DB::transaction(function () use ($request, $address) {
			$data = $this->beforeUpdate($address, $request->validated(), $request);
			$address->update($data);
			$this->afterUpdate($address, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Address updated successfully.'),
			'data' => new AddressResource($address),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Address $address
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Address $address): Response
	{
		DB::transaction(function () use ($request, $address) {
			$this->beforeDestroy($address, $request);
			$address->delete();
			$this->afterDestroy($address, $request);
		});

		return response()->noContent();
	}


	/*
	 * Hooks. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Para barrar a operação, lance uma exceção ou chame abort(): em store/update/destroy isso desfaz a gravação.
	 */

	/**
	 * Ajusta a query do `index` antes de paginar (filtro por usuário, escopos, ordenação).
	 */
	protected function indexQuery(Builder $query, Request $request): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados e devolve os dados a gravar.
	 */
	protected function beforeStore(array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação): efeitos colaterais com o registro gravado.
	 */
	protected function afterStore(Address $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Address $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Address $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Address $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Address $model, Request $request): void
	{
	}

}
