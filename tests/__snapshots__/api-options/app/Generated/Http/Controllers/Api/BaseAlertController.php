<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\AlertController (app/Http/Controllers/Api/AlertController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Http\Requests\AlertRequest;
use App\Http\Resources\AlertCollection;
use App\Http\Resources\AlertResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseAlertController extends Controller
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
		$query = Alert::query();

		$query->with(['client']);

		$query->when(
			$request->filled('client_id') && is_string($request->query('client_id')),
			fn ($query) => $query->where('client_id', $request->query('client_id')),
		);

		$sort = $request->query('sort');
		$sortColumn = is_string($sort) ? ltrim($sort, '-') : null;

		if (in_array($sortColumn, ['title'], true)) {
			$query->orderBy($sortColumn, str_starts_with($sort, '-') ? 'desc' : 'asc');
		}

		// Hook do usuário: roda depois dos filtros, da busca e da ordenação declarados no manifest.
		$query = $this->indexQuery($query, $request);

		return (new AlertCollection($query->paginate(25)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AlertRequest $request): JsonResponse
	{
		$alert = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Alert::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Alert created successfully.'),
			'data' => new AlertResource($alert),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Alert $alert): JsonResponse
	{
		$alert->load(['client']);

		return response()->json([
			'status' => 200,
			'data' => new AlertResource($alert),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AlertRequest $request, Alert $alert): JsonResponse
	{
		DB::transaction(function () use ($request, $alert) {
			$data = $this->beforeUpdate($alert, $request->validated(), $request);
			$alert->update($data);
			$this->afterUpdate($alert, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Alert updated successfully.'),
			'data' => new AlertResource($alert),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Alert $alert
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Alert $alert): Response
	{
		DB::transaction(function () use ($request, $alert) {
			$this->beforeDestroy($alert, $request);
			$alert->delete();
			$this->afterDestroy($alert, $request);
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
	protected function afterStore(Alert $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Alert $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Alert $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Alert $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Alert $model, Request $request): void
	{
	}

}
