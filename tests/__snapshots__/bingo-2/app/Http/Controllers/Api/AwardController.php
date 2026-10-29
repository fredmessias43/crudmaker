<?php

namespace App\Http\Controllers\Api;

use App\Generated\Http\Controllers\Api\BaseAwardController;

/**
 * Camada de customização do controller de Award.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas (index, store, show, update, destroy) ficam em
 * App\Generated\Http\Controllers\Api\BaseAwardController (app/Generated/Http/Controllers/Api/BaseAwardController.php), que não deve ser editada.
 */
class AwardController extends BaseAwardController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Award;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function indexQuery(Builder $query, Request $request): Builder; // antes de paginar
	 *   protected function beforeStore(array $data, Request $request): array; // dados validados -> dados a gravar
	 *   protected function afterStore(Award $model, Request $request): void; // depois de criar
	 *   protected function beforeUpdate(Award $model, array $data, Request $request): array; // dados validados -> dados a gravar
	 *   protected function afterUpdate(Award $model, Request $request): void; // depois de atualizar
	 *   protected function beforeDestroy(Award $model, Request $request): void; // antes de remover
	 *   protected function afterDestroy(Award $model, Request $request): void; // depois de remover
	 *
	 * store, update e destroy rodam a gravação e os hooks na mesma transação (DB::transaction):
	 * para barrar a operação, lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
