<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseClassLessonCollection;

/**
 * Camada de customização da collection de ClassLesson.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseClassLessonCollection (app/Generated/Http/Resources/BaseClassLessonCollection.php), que não deve ser editada.
 */
class ClassLessonCollection extends BaseClassLessonCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * ClassLessonResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
