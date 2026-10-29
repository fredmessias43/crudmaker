<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseClassLessonAttendeeCollection;

/**
 * Camada de customização da collection de ClassLessonAttendee.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseClassLessonAttendeeCollection (app/Generated/Http/Resources/BaseClassLessonAttendeeCollection.php), que não deve ser editada.
 */
class ClassLessonAttendeeCollection extends BaseClassLessonAttendeeCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * ClassLessonAttendeeResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
