<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseOrderItemRequest;

/**
 * Camada de customização da request de OrderItem.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseOrderItemRequest (app/Generated/Http/Requests/BaseOrderItemRequest.php), que não deve ser editada.
 */
class OrderItemRequest extends BaseOrderItemRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
