<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BasePlayerPlayerInviteController;

/**
 * Camada de customização do controller aninhado de Player -> playerInvites.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BasePlayerPlayerInviteController (app/Generated/Http/Controllers/Api/Relationships/BasePlayerPlayerInviteController.php), que não deve ser editada.
 * Esta classe estende o controller de PlayerInvite, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class PlayerPlayerInviteController extends BasePlayerPlayerInviteController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Player;
	 *   use App\Models\PlayerInvite;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, Player $player): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, Player $player): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(PlayerInvite $model, Request $request, Player $player): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
