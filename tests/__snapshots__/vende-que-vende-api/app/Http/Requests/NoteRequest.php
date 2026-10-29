<?php

namespace App\Http\Requests;

use App\Generated\Http\Requests\BaseNoteRequest;

/**
 * Camada de customização da request de Note.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As regras geradas ficam em App\Generated\Http\Requests\BaseNoteRequest (app/Generated/Http/Requests/BaseNoteRequest.php), que não deve ser editada.
 */
class NoteRequest extends BaseNoteRequest
{
	/*
	 * Hook e método que você pode sobrescrever aqui:
	 *
	 *   protected function extraRules(): array; // regras somadas às geradas (a mesma chave de campo substitui a gerada)
	 *   public function authorize(): bool; // a base libera tudo (return true)
	 */
}
