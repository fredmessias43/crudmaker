<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\GameDrawnNumbersController (app/Http/Controllers/Api/Relationships/GameDrawnNumbersController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\DrawnNumbersController;
use App\Models\Game;
use App\Models\DrawnNumbers;
use App\Http\Requests\DrawnNumbersRequest;
use App\Http\Resources\DrawnNumbersCollection;
use App\Http\Resources\DrawnNumbersResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Game -> drawnNumbers (hasMany).
 *
 * Estende o controller de DrawnNumbers: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseGameDrawnNumbersController extends DrawnNumbersController
{

	/**
	 * Display a paginated listing of the DrawnNumbers records of a Game.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de DrawnNumbers.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Game $game): JsonResponse
	{
		$query = DrawnNumbers::query()->where('game_id', $game->getKey());

		// Hooks do usuário: primeiro o de DrawnNumbers (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $game);

		return (new DrawnNumbersCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created DrawnNumbers for a Game.
	 *
	 * A chave estrangeira ('game_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\DrawnNumbersRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(DrawnNumbersRequest $request, Game $game): JsonResponse
	{
		$drawnNumbers = DB::transaction(function () use ($request, $game) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $game);
			$data['game_id'] = $game->getKey();

			$model = DrawnNumbers::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $game);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('DrawnNumbers created successfully.'),
			'data' => new DrawnNumbersResource($drawnNumbers),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Game) além do que o hook de DrawnNumbers recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Game $game): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de DrawnNumbers) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Game $game): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de DrawnNumbers.
	 */
	protected function nestedAfterStore(DrawnNumbers $model, Request $request, Game $game): void
	{
	}

}
