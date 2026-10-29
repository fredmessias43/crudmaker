<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseOrderOrderItemController;

/**
 * Camada de customização do controller aninhado de Order -> orderItems.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseOrderOrderItemController (app/Generated/Http/Controllers/Api/Relationships/BaseOrderOrderItemController.php), que não deve ser editada.
 * Esta classe estende o controller de OrderItem, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class OrderOrderItemController extends BaseOrderOrderItemController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Order;
	 *   use App\Models\OrderItem;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, Order $order): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, Order $order): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(OrderItem $model, Request $request, Order $order): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
