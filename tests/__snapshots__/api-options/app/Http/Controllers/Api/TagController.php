<?php

namespace App\Http\Controllers\Api;

use App\Generated\Http\Controllers\Api\BaseTagController;

/**
 * Camada de customização do controller de Tag.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas (index, show) ficam em
 * App\Generated\Http\Controllers\Api\BaseTagController (app/Generated/Http/Controllers/Api/BaseTagController.php), que não deve ser editada.
 */
class TagController extends BaseTagController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Tag;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function indexQuery(Builder $query, Request $request): Builder; // antes de paginar
	 *
	 * store, update e destroy rodam a gravação e os hooks na mesma transação (DB::transaction):
	 * para barrar a operação, lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
