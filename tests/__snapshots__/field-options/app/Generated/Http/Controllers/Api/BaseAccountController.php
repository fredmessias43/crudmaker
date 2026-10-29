<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\AccountController (app/Http/Controllers/Api/AccountController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Http\Requests\AccountRequest;
use App\Http\Resources\AccountCollection;
use App\Http\Resources\AccountResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseAccountController extends Controller
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
		$query = $this->indexQuery(Account::query(), $request);

		return (new AccountCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AccountRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(AccountRequest $request): JsonResponse
	{
		$account = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Account::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Account created successfully.'),
			'data' => new AccountResource($account),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Account $account
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Account $account): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new AccountResource($account),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AccountRequest $request
	 * @param  \App\Models\Account $account
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(AccountRequest $request, Account $account): JsonResponse
	{
		DB::transaction(function () use ($request, $account) {
			$data = $this->beforeUpdate($account, $request->validated(), $request);
			$account->update($data);
			$this->afterUpdate($account, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Account updated successfully.'),
			'data' => new AccountResource($account),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Account $account
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Account $account): Response
	{
		DB::transaction(function () use ($request, $account) {
			$this->beforeDestroy($account, $request);
			$account->delete();
			$this->afterDestroy($account, $request);
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
	protected function afterStore(Account $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Account $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Account $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Account $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Account $model, Request $request): void
	{
	}

}
