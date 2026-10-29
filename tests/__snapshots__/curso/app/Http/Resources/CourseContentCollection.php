<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseCourseContentCollection;

/**
 * Camada de customização da collection de CourseContent.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseCourseContentCollection (app/Generated/Http/Resources/BaseCourseContentCollection.php), que não deve ser editada.
 */
class CourseContentCollection extends BaseCourseContentCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * CourseContentResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
