<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseStudentRequest;

/**
 * Camada de customização da request de Student.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseStudentRequest (app/Generated/Http/Requests/BaseStudentRequest.php), que não deve ser editada.
 */
class StudentRequest extends BaseStudentRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
