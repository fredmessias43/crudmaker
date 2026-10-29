<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseStudentCollection;

/**
 * Camada de customização da collection de Student.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseStudentCollection (app/Generated/Http/Resources/BaseStudentCollection.php), que não deve ser editada.
 */
class StudentCollection extends BaseStudentCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * StudentResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
