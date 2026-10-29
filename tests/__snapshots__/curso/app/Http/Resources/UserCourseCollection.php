<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseUserCourseCollection;

/**
 * Camada de customização da collection de UserCourse.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseUserCourseCollection (app/Generated/Http/Resources/BaseUserCourseCollection.php), que não deve ser editada.
 */
class UserCourseCollection extends BaseUserCourseCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * UserCourseResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
