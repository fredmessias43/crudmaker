<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseUserRequest;

/**
 * Camada de customização da request de User.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseUserRequest (app/Generated/Http/Requests/BaseUserRequest.php), que não deve ser editada.
 */
class UserRequest extends BaseUserRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
