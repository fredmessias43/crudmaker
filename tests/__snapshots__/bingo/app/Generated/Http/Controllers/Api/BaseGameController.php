<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\GameController (app/Http/Controllers/Api/GameController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Http\Requests\GameRequest;
use App\Http\Resources\GameCollection;
use App\Http\Resources\GameResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseGameController extends Controller
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
		$query = $this->indexQuery(Game::query(), $request);

		return (new GameCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(GameRequest $request): JsonResponse
	{
		$game = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Game::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Game created successfully.'),
			'data' => new GameResource($game),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Game $game): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new GameResource($game),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\GameRequest $request
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(GameRequest $request, Game $game): JsonResponse
	{
		DB::transaction(function () use ($request, $game) {
			$data = $this->beforeUpdate($game, $request->validated(), $request);
			$game->update($data);
			$this->afterUpdate($game, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Game updated successfully.'),
			'data' => new GameResource($game),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Game $game
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Game $game): Response
	{
		DB::transaction(function () use ($request, $game) {
			$this->beforeDestroy($game, $request);
			$game->delete();
			$this->afterDestroy($game, $request);
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
	protected function afterStore(Game $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Game $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Game $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Game $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Game $model, Request $request): void
	{
	}

}
