<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseClassLessonRequest;

/**
 * Camada de customização da request de ClassLesson.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseClassLessonRequest (app/Generated/Http/Requests/BaseClassLessonRequest.php), que não deve ser editada.
 */
class ClassLessonRequest extends BaseClassLessonRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
