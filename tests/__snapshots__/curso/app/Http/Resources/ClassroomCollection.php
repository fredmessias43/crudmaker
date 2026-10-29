<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseClassroomCollection;

/**
 * Camada de customização da collection de Classroom.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseClassroomCollection (app/Generated/Http/Resources/BaseClassroomCollection.php), que não deve ser editada.
 */
class ClassroomCollection extends BaseClassroomCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * ClassroomResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
