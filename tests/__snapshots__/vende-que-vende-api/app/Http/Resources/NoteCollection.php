<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseNoteCollection;

/**
 * Camada de customização da collection de Note.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseNoteCollection (app/Generated/Http/Resources/BaseNoteCollection.php), que não deve ser editada.
 */
class NoteCollection extends BaseNoteCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * NoteResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
