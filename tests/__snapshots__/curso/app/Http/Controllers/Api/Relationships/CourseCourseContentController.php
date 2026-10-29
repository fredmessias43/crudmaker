<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseCourseCourseContentController;

/**
 * Camada de customização do controller aninhado de Course -> courseContents.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseCourseCourseContentController (app/Generated/Http/Controllers/Api/Relationships/BaseCourseCourseContentController.php), que não deve ser editada.
 * Esta classe estende o controller de CourseContent, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class CourseCourseContentController extends BaseCourseCourseContentController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Course;
	 *   use App\Models\CourseContent;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedIndexQuery(Builder $query, Request $request, Course $course): Builder; // antes de paginar
	 *   protected function nestedBeforeStore(array $data, Request $request, Course $course): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(CourseContent $model, Request $request, Course $course): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
