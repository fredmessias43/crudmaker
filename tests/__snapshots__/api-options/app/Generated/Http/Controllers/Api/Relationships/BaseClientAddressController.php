<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClientAddressController (app/Http/Controllers/Api/Relationships/ClientAddressController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\AddressController;
use App\Models\Client;
use App\Models\Address;
use App\Http\Requests\AddressRequest;
use App\Http\Resources\AddressResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Client -> address (hasOne).
 *
 * Estende o controller de Address: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClientAddressController extends AddressController
{

	/**
	 * Display the Address of a Client (404 se ele ainda não tem).
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedShow(Request $request, Client $client): JsonResponse
	{
		$query = Address::query()->where('client_id', $client->getKey());

		$query = $this->nestedShowQuery($query, $request, $client);

		return response()->json([
			'status' => 200,
			'data' => new AddressResource($query->firstOrFail()),
		], 200);
	}


	/**
	 * Store a newly created Address for a Client.
	 *
	 * A chave estrangeira ('client_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AddressRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(AddressRequest $request, Client $client): JsonResponse
	{
		if ($client->address()->exists()) {
			return response()->json([
				'status' => 409,
				'message' => trans('Address already exists for this Client.'),
			], 409);
		}

		$address = DB::transaction(function () use ($request, $client) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $client);
			$data['client_id'] = $client->getKey();

			$model = Address::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $client);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Address created successfully.'),
			'data' => new AddressResource($address),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Client) além do que o hook de Address recebe.
	 */

	/**
	 * Ajusta a query do `nestedShow` (já filtrada pelo pai).
	 */
	protected function nestedShowQuery(Builder $query, Request $request, Client $client): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Address) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Client $client): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Address.
	 */
	protected function nestedAfterStore(Address $model, Request $request, Client $client): void
	{
	}

}
