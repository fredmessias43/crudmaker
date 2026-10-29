<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseCourseRequest;

/**
 * Camada de customização da request de Course.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseCourseRequest (app/Generated/Http/Requests/BaseCourseRequest.php), que não deve ser editada.
 */
class CourseRequest extends BaseCourseRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
