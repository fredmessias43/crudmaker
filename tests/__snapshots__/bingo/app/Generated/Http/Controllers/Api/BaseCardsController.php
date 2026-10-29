<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\CardsController (app/Http/Controllers/Api/CardsController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cards;
use App\Http\Requests\CardsRequest;
use App\Http\Resources\CardsCollection;
use App\Http\Resources\CardsResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseCardsController extends Controller
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
		$query = $this->indexQuery(Cards::query(), $request);

		return (new CardsCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CardsRequest $request): JsonResponse
	{
		$cards = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Cards::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Cards created successfully.'),
			'data' => new CardsResource($cards),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Cards $cards): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CardsResource($cards),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\CardsRequest $request
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CardsRequest $request, Cards $cards): JsonResponse
	{
		DB::transaction(function () use ($request, $cards) {
			$data = $this->beforeUpdate($cards, $request->validated(), $request);
			$cards->update($data);
			$this->afterUpdate($cards, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Cards updated successfully.'),
			'data' => new CardsResource($cards),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Cards $cards
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Cards $cards): Response
	{
		DB::transaction(function () use ($request, $cards) {
			$this->beforeDestroy($cards, $request);
			$cards->delete();
			$this->afterDestroy($cards, $request);
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
	protected function afterStore(Cards $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Cards $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Cards $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Cards $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Cards $model, Request $request): void
	{
	}

}
