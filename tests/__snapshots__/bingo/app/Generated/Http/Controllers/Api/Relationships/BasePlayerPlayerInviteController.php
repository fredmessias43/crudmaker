<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\PlayerPlayerInviteController (app/Http/Controllers/Api/Relationships/PlayerPlayerInviteController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\PlayerInviteController;
use App\Models\Player;
use App\Models\PlayerInvite;
use App\Http\Requests\PlayerInviteRequest;
use App\Http\Resources\PlayerInviteCollection;
use App\Http\Resources\PlayerInviteResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Player -> playerInvites (hasMany).
 *
 * Estende o controller de PlayerInvite: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BasePlayerPlayerInviteController extends PlayerInviteController
{

	/**
	 * Display a paginated listing of the PlayerInvite records of a Player.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de PlayerInvite.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Player $player): JsonResponse
	{
		$query = PlayerInvite::query()->where('player_id', $player->getKey());

		// Hooks do usuário: primeiro o de PlayerInvite (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $player);

		return (new PlayerInviteCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created PlayerInvite for a Player.
	 *
	 * A chave estrangeira ('player_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\PlayerInviteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(PlayerInviteRequest $request, Player $player): JsonResponse
	{
		$playerInvite = DB::transaction(function () use ($request, $player) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $player);
			$data['player_id'] = $player->getKey();

			$model = PlayerInvite::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $player);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('PlayerInvite created successfully.'),
			'data' => new PlayerInviteResource($playerInvite),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Player) além do que o hook de PlayerInvite recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Player $player): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de PlayerInvite) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Player $player): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de PlayerInvite.
	 */
	protected function nestedAfterStore(PlayerInvite $model, Request $request, Player $player): void
	{
	}

}
