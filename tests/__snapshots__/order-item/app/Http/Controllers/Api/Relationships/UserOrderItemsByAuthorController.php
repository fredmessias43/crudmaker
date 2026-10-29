<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseUserOrderItemsByAuthorController;

/**
 * Camada de customização do controller aninhado de User -> orderItemsByAuthor.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseUserOrderItemsByAuthorController (app/Generated/Http/Controllers/Api/Relationships/BaseUserOrderItemsByAuthorController.php), que não deve ser editada.
 * Esta classe estende o controller de OrderItem, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class UserOrderItemsByAuthorController extends BaseUserOrderItemsByAuthorController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\User;
	 *   use App\Models\OrderItem;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, User $user): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, User $user): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(OrderItem $model, Request $request, User $user): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
