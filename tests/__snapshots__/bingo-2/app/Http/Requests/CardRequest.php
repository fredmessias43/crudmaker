<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseCardRequest;

/**
 * Camada de customização da request de Card.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseCardRequest (app/Generated/Http/Requests/BaseCardRequest.php), que não deve ser editada.
 */
class CardRequest extends BaseCardRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
