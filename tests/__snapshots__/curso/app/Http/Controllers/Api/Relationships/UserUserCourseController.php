<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseUserUserCourseController;

/**
 * Camada de customização do controller aninhado de User -> userCourses.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseUserUserCourseController (app/Generated/Http/Controllers/Api/Relationships/BaseUserUserCourseController.php), que não deve ser editada.
 * Esta classe estende o controller de UserCourse, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class UserUserCourseController extends BaseUserUserCourseController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\User;
	 *   use App\Models\UserCourse;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, User $user): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, User $user): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(UserCourse $model, Request $request, User $user): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
