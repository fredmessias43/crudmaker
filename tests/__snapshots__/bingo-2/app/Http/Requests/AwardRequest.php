<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseAwardRequest;

/**
 * Camada de customização da request de Award.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseAwardRequest (app/Generated/Http/Requests/BaseAwardRequest.php), que não deve ser editada.
 */
class AwardRequest extends BaseAwardRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
