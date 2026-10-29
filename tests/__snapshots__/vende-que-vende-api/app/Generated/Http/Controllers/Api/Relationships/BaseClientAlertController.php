<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClientAlertController (app/Http/Controllers/Api/Relationships/ClientAlertController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\AlertController;
use App\Models\Client;
use App\Models\Alert;
use App\Http\Requests\AlertRequest;
use App\Http\Resources\AlertCollection;
use App\Http\Resources\AlertResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Client -> alerts (hasMany).
 *
 * Estende o controller de Alert: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClientAlertController extends AlertController
{

	/**
	 * Display a paginated listing of the Alert records of a Client.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de Alert.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Client $client): JsonResponse
	{
		$query = Alert::query()->where('client_id', $client->getKey());

		// Hooks do usuário: primeiro o de Alert (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $client);

		return (new AlertCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created Alert for a Client.
	 *
	 * A chave estrangeira ('client_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AlertRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(AlertRequest $request, Client $client): JsonResponse
	{
		$alert = DB::transaction(function () use ($request, $client) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $client);
			$data['client_id'] = $client->getKey();

			$model = Alert::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $client);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Alert created successfully.'),
			'data' => new AlertResource($alert),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Client) além do que o hook de Alert recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Client $client): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Alert) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Client $client): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Alert.
	 */
	protected function nestedAfterStore(Alert $model, Request $request, Client $client): void
	{
	}

}
