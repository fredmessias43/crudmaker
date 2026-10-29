<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\CardController (app/Http/Controllers/Api/CardController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Http\Requests\CardRequest;
use App\Http\Resources\CardCollection;
use App\Http\Resources\CardResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseCardController extends Controller
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
		$query = $this->indexQuery(Card::query(), $request);

		return (new CardCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(CardRequest $request): JsonResponse
	{
		$card = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Card::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Card created successfully.'),
			'data' => new CardResource($card),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Card $card): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new CardResource($card),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\CardRequest $request
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(CardRequest $request, Card $card): JsonResponse
	{
		DB::transaction(function () use ($request, $card) {
			$data = $this->beforeUpdate($card, $request->validated(), $request);
			$card->update($data);
			$this->afterUpdate($card, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Card updated successfully.'),
			'data' => new CardResource($card),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Card $card
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Card $card): Response
	{
		DB::transaction(function () use ($request, $card) {
			$this->beforeDestroy($card, $request);
			$card->delete();
			$this->afterDestroy($card, $request);
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
	protected function afterStore(Card $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Card $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Card $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Card $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Card $model, Request $request): void
	{
	}

}
