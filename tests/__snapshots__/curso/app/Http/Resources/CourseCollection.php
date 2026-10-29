<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseCourseCollection;

/**
 * Camada de customização da collection de Course.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseCourseCollection (app/Generated/Http/Resources/BaseCourseCollection.php), que não deve ser editada.
 */
class CourseCollection extends BaseCourseCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * CourseResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
