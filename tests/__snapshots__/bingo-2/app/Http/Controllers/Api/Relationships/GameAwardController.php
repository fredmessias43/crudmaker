<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseGameAwardController;

/**
 * Camada de customização do controller aninhado de Game -> awards.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseGameAwardController (app/Generated/Http/Controllers/Api/Relationships/BaseGameAwardController.php), que não deve ser editada.
 * Esta classe estende o controller de Award, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class GameAwardController extends BaseGameAwardController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Game;
	 *   use App\Models\Award;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, Game $game): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, Game $game): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(Award $model, Request $request, Game $game): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
