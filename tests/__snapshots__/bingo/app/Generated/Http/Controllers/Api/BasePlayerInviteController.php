<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\PlayerInviteController (app/Http/Controllers/Api/PlayerInviteController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlayerInvite;
use App\Http\Requests\PlayerInviteRequest;
use App\Http\Resources\PlayerInviteCollection;
use App\Http\Resources\PlayerInviteResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BasePlayerInviteController extends Controller
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
		$query = $this->indexQuery(PlayerInvite::query(), $request);

		return (new PlayerInviteCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(PlayerInviteRequest $request): JsonResponse
	{
		$playerInvite = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = PlayerInvite::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('PlayerInvite created successfully.'),
			'data' => new PlayerInviteResource($playerInvite),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(PlayerInvite $playerInvite): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new PlayerInviteResource($playerInvite),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(PlayerInviteRequest $request, PlayerInvite $playerInvite): JsonResponse
	{
		DB::transaction(function () use ($request, $playerInvite) {
			$data = $this->beforeUpdate($playerInvite, $request->validated(), $request);
			$playerInvite->update($data);
			$this->afterUpdate($playerInvite, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('PlayerInvite updated successfully.'),
			'data' => new PlayerInviteResource($playerInvite),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\PlayerInvite $playerInvite
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, PlayerInvite $playerInvite): Response
	{
		DB::transaction(function () use ($request, $playerInvite) {
			$this->beforeDestroy($playerInvite, $request);
			$playerInvite->delete();
			$this->afterDestroy($playerInvite, $request);
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
	protected function afterStore(PlayerInvite $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(PlayerInvite $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(PlayerInvite $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(PlayerInvite $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(PlayerInvite $model, Request $request): void
	{
	}

}
