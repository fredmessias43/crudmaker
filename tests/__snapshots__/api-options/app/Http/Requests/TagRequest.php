<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseTagRequest;

/**
 * Camada de customização da request de Tag.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseTagRequest (app/Generated/Http/Requests/BaseTagRequest.php), que não deve ser editada.
 */
class TagRequest extends BaseTagRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
