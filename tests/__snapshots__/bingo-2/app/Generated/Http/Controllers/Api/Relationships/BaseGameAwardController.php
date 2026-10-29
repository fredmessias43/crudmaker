<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\GameAwardController (app/Http/Controllers/Api/Relationships/GameAwardController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\AwardController;
use App\Models\Game;
use App\Models\Award;
use App\Http\Requests\AwardRequest;
use App\Http\Resources\AwardCollection;
use App\Http\Resources\AwardResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Game -> awards (hasMany).
 *
 * Estende o controller de Award: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseGameAwardController extends AwardController
{

	/**
	 * Display a paginated listing of the Award records of a Game.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de Award.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Game $game): JsonResponse
	{
		$query = Award::query()->where('game_id', $game->getKey());

		// Hooks do usuário: primeiro o de Award (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $game);

		return (new AwardCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created Award for a Game.
	 *
	 * A chave estrangeira ('game_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\AwardRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(AwardRequest $request, Game $game): JsonResponse
	{
		$award = DB::transaction(function () use ($request, $game) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $game);
			$data['game_id'] = $game->getKey();

			$model = Award::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $game);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Award created successfully.'),
			'data' => new AwardResource($award),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Game) além do que o hook de Award recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Game $game): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Award) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Game $game): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Award.
	 */
	protected function nestedAfterStore(Award $model, Request $request, Game $game): void
	{
	}

}
