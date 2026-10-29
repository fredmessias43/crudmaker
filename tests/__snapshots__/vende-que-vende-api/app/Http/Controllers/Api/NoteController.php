<?php

namespace App\Http\Controllers\Api;

use App\Generated\Http\Controllers\Api\BaseNoteController;

/**
 * Camada de customização do controller de Note.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas (index, store, show, update, destroy) ficam em
 * App\Generated\Http\Controllers\Api\BaseNoteController (app/Generated/Http/Controllers/Api/BaseNoteController.php), que não deve ser editada.
 */
class NoteController extends BaseNoteController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Note;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function indexQuery(Builder $query, Request $request): Builder; // antes de paginar
	 *   protected function beforeStore(array $data, Request $request): array; // dados validados -> dados a gravar
	 *   protected function afterStore(Note $model, Request $request): void; // depois de criar
	 *   protected function beforeUpdate(Note $model, array $data, Request $request): array; // dados validados -> dados a gravar
	 *   protected function afterUpdate(Note $model, Request $request): void; // depois de atualizar
	 *   protected function beforeDestroy(Note $model, Request $request): void; // antes de remover
	 *   protected function afterDestroy(Note $model, Request $request): void; // depois de remover
	 *
	 * store, update e destroy rodam a gravação e os hooks na mesma transação (DB::transaction):
	 * para barrar a operação, lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
