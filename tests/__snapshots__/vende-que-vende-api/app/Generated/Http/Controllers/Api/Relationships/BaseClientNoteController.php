<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClientNoteController (app/Http/Controllers/Api/Relationships/ClientNoteController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\NoteController;
use App\Models\Client;
use App\Models\Note;
use App\Http\Requests\NoteRequest;
use App\Http\Resources\NoteResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Client -> note (hasOne).
 *
 * Estende o controller de Note: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClientNoteController extends NoteController
{

	/**
	 * Display the Note of a Client (404 se ele ainda não tem).
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedShow(Request $request, Client $client): JsonResponse
	{
		$query = Note::query()->where('client_id', $client->getKey());

		$query = $this->nestedShowQuery($query, $request, $client);

		return response()->json([
			'status' => 200,
			'data' => new NoteResource($query->firstOrFail()),
		], 200);
	}


	/**
	 * Store a newly created Note for a Client.
	 *
	 * A chave estrangeira ('client_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(NoteRequest $request, Client $client): JsonResponse
	{
		if ($client->note()->exists()) {
			return response()->json([
				'status' => 409,
				'message' => trans('Note already exists for this Client.'),
			], 409);
		}

		$note = DB::transaction(function () use ($request, $client) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $client);
			$data['client_id'] = $client->getKey();

			$model = Note::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $client);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Note created successfully.'),
			'data' => new NoteResource($note),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Client) além do que o hook de Note recebe.
	 */

	/**
	 * Ajusta a query do `nestedShow` (já filtrada pelo pai).
	 */
	protected function nestedShowQuery(Builder $query, Request $request, Client $client): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Note) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Client $client): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Note.
	 */
	protected function nestedAfterStore(Note $model, Request $request, Client $client): void
	{
	}

}
