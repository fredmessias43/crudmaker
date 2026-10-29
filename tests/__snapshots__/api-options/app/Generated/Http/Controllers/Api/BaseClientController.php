<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\ClientController (app/Http/Controllers/Api/ClientController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientCollection;
use App\Http\Resources\ClientResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


abstract class BaseClientController extends Controller
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
		$query = Client::query();

		$query->with(['address', 'alerts']);

		$query->when(
			$request->filled('status') && in_array($request->query('status'), ['active', 'blocked'], true),
			fn ($query) => $query->where('status', $request->query('status')),
		);

		$query->when(
			$request->filled('vip'),
			fn ($query) => $query->where('vip', $request->boolean('vip')),
		);

		$query->when($request->filled('search') && is_string($request->query('search')), function ($query) use ($request) {
			$term = '%' . $request->query('search') . '%';

			$query->where(function ($query) use ($term) {
				foreach (['name', 'email'] as $column) {
					$query->orWhere($column, 'like', $term);
				}
			});
		});

		$sort = $request->query('sort');
		$sortColumn = is_string($sort) ? ltrim($sort, '-') : null;

		if (in_array($sortColumn, ['name', 'created_at'], true)) {
			$query->orderBy($sortColumn, str_starts_with($sort, '-') ? 'desc' : 'asc');
		} else {
			$query->orderBy('created_at', 'desc');
		}

		// Hook do usuário: roda depois dos filtros, da busca e da ordenação declarados no manifest.
		$query = $this->indexQuery($query, $request);

		return (new ClientCollection($query->paginate(20)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(ClientRequest $request): JsonResponse
	{
		$client = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Client::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Client created successfully.'),
			'data' => new ClientResource($client),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Client $client): JsonResponse
	{
		$client->load(['address', 'alerts']);

		return response()->json([
			'status' => 200,
			'data' => new ClientResource($client),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\ClientRequest $request
	 * @param  \App\Models\Client $client
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(ClientRequest $request, Client $client): JsonResponse
	{
		DB::transaction(function () use ($request, $client) {
			$data = $this->beforeUpdate($client, $request->validated(), $request);
			$client->update($data);
			$this->afterUpdate($client, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Client updated successfully.'),
			'data' => new ClientResource($client),
		], 200);
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
	protected function afterStore(Client $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Client $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Client $model, Request $request): void
	{
	}

}
