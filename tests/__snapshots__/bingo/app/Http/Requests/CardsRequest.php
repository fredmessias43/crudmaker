<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseCardsRequest;

/**
 * Camada de customização da request de Cards.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseCardsRequest (app/Generated/Http/Requests/BaseCardsRequest.php), que não deve ser editada.
 */
class CardsRequest extends BaseCardsRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
